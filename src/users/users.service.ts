import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { AuthService } from 'src/auth/auth.service';
import * as bcrypt from 'bcryptjs';
import { ExceptionService } from '../common/exceptions/exceptions.service';
import { PermissionsTypes } from './enums/permissions.enum';
import { UpdateMailDto } from './dto/updateMail.dto';
import { UpdatePasswordDto } from './dto/updatePassword.dto';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(ExceptionService) private readonly exceptionService: ExceptionService,
  ) { }


  async create(createUserDto: CreateUserDto) {
    try {
      const { password, permissions, email } = createUserDto;

      const user = this.userRepository.create({
        email: email.toLowerCase().trim(),
        password: await bcrypt.hash(password, 10),
        permissions: permissions?.length == 0 ? [PermissionsTypes.USER] : permissions,
      })

      await this.userRepository.save(user);

      return {
        ...user,
        token: this.authService.getJwtToken({ id: user.id })
      }

    } catch (error) {
      // Re-lanzar errores de negocio directamente
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException) {
        throw error;
      }
      // Solo errores de base de datos van al handler
      this.exceptionService.handleDBError(error, 'UsersService.reactiveUser');
    }
  }

  async findAll() {
    try {
      return await this.userRepository.find({
        select: ['id', 'email', 'permissions', 'isActive', 'createdAt', 'updatedAt'],
      });
    } catch (error) {
      // Re-lanzar errores de negocio directamente
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException) {
        throw error;
      }
      // Solo errores de base de datos van al handler
      this.exceptionService.handleDBError(error, 'UsersService.reactiveUser');
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.findUserById(id);
      return user;
    } catch (error) {
      // Re-lanzar errores de negocio directamente
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException) {
        throw error;
      }
      // Solo errores de base de datos van al handler
      this.exceptionService.handleDBError(error, 'UsersService.reactiveUser');
    }
  }

  async updateMail(id: string, updateMailDto: UpdateMailDto) {
    try {
      const { email } = updateMailDto;
      const normalizedEmail = email?.toLowerCase().trim();

      const user = await this.findUserById(id);

      if (!user.isActive) {
        throw new BadRequestException('User is not active');
      }

      if (user.email === normalizedEmail) {
        throw new BadRequestException('The email is already the same.');
      }

      const existingUser = await this.userRepository.findOneBy({ email: normalizedEmail });
      if (existingUser && existingUser.id !== user.id) {
        throw new BadRequestException('Email already in use by another user.');
      }

      const arrowsAffected = await this.userRepository.update(id, { email: normalizedEmail });
      if (arrowsAffected.affected === 0) {
        throw new InternalServerErrorException('Failed to update email.');
      }
      return {
        message: 'Email updated',
      }
    } catch (error) {
      // Re-lanzar errores de negocio directamente
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException) {
        throw error;
      }
      // Solo errores de base de datos van al handler
      this.exceptionService.handleDBError(error, 'UsersService.reactiveUser');
    }

  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto) {
    try {
      const { password } = updatePasswordDto;
      const user = await this.findUserById(id);

      if (!user.isActive) {
        throw new BadRequestException('User is not active');
      }

      user.password = bcrypt.hashSync(password!, 10);
      await this.userRepository.save(user);
      return {
        message: 'Password updated',
      }
    } catch (error) {
      // Re-lanzar errores de negocio directamente
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException) {
        throw error;
      }
      // Solo errores de base de datos van al handler
      this.exceptionService.handleDBError(error, 'UsersService.reactiveUser');
    }

  }

  async remove(id: string) {
    try {
      const user = await this.findUserById(id);

      if (user.isActive) {
        throw new BadRequestException('Cannot delete an active user. Please deactivate account first.');
      }

      const result = await this.userRepository.delete(id);
      if (result.affected === 0) {
        throw new InternalServerErrorException('Failed to delete user.');
      }

      return {
        message: `User with id ${id} deleted`,
      }
    } catch (error) {
      // Re-lanzar errores de negocio directamente
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException) {
        throw error;
      }
      // Solo errores de base de datos van al handler
      this.exceptionService.handleDBError(error, 'UsersService.reactiveUser');
    }
  }

  async updatePermissions(id: string, updateUserDto: UpdateUserDto) {
    try {
      const { permissions } = updateUserDto;
      const user = await this.findUserById(id);

      if (!user.isActive) {
        throw new BadRequestException('User is not active');
      }

      user.permissions = permissions || [];
      await this.userRepository.save(user);

      return user;
    } catch (error) {
      // Re-lanzar errores de negocio directamente
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException) {
        throw error;
      }
      // Solo errores de base de datos van al handler
      this.exceptionService.handleDBError(error, 'UsersService.reactiveUser');
    }
  }

  async desactiveUser(id: string) {
    try {
      const user = await this.findUserById(id);
      if (!user.isActive) {
        throw new BadRequestException('User is not active');
      }

      user.isActive = false;
      await this.userRepository.save(user);

      return user;
    } catch (error) {
      // Re-lanzar errores de negocio directamente
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException) {
        throw error;
      }
      // Solo errores de base de datos van al handler
      this.exceptionService.handleDBError(error, 'UsersService.reactiveUser');
    }
  }

  async reactiveUser(id: string) {
    try {
      const user = await this.findUserById(id);

      if (user.isActive) {
        throw new BadRequestException('User is already active');
      }

      user.isActive = true;

      const savedUser = await this.userRepository.save(user);

      return savedUser;
    } catch (error) {
      // Re-lanzar errores de negocio directamente
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException) {
        throw error;
      }
      // Solo errores de base de datos van al handler
      this.exceptionService.handleDBError(error, 'UsersService.reactiveUser');
    }
  }



  private async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

}
