import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditInterceptor } from './interceptors/audit.interceptor.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditLogController],
  providers: [AuditLogService, AuditInterceptor],
  exports: [
    AuditLogService,
    AuditInterceptor
  ]
})
export class AuditLogModule { }
