import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMailDto } from './dto/updateMail.dto';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { Auth } from 'src/auth/decorators/auth.decorator.ts.decorator';
import { PermissionsTypes } from './enums/permissions.enum';
import { Throttle } from '@nestjs/throttler';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Throttle({ short: {} })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Auth(PermissionsTypes.SUPER_ADMIN, PermissionsTypes.USER)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/mail')
  updateMail(@Param('id') id: string, @Body() updateMailDto: UpdateMailDto) {
    return this.usersService.updateMail(id, updateMailDto);
  }

  @Patch(':id/password')
  updatePassword(@Param('id') id: string, @Body() updatePasswordDto: UpdatePasswordDto) {
    return this.usersService.updatePassword(id, updatePasswordDto);
  }

  @Patch(':id/permissions')
  updatePermissions(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updatePermissions(id, updateUserDto);
  }

  @Patch(':id/reactive')
  reactiveUser(@Param('id') id: string) {
    return this.usersService.reactiveUser(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Delete(':id/desactive')
  desactiveUser(@Param('id') id: string) {
    return this.usersService.desactiveUser(id);
  }
}
