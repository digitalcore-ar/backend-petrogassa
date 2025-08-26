import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { AuditLogModule } from 'src/audit-log/audit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule, CommonModule, AuditLogModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule]
})
export class UsersModule { }
