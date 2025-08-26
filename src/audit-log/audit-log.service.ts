import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { Repository } from 'typeorm';
import { CreateAuditLogData } from './interfaces/createAuditLogData.interface';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog) private auditLogRepository: Repository<AuditLog>
  ) { }

  async createAuditLog(data: CreateAuditLogData) {
    const auditLog = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(auditLog);
  }

  //Metodos para consultar auditorias
  async findByUser(userId: string) {
    return await this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    })
  }

  async findByTable(tableName: string) {
    return await this.auditLogRepository.find({
      where: { tableName },
      order: { createdAt: 'DESC' }
    })
  }

}
