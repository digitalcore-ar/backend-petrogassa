import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  Injectable,
  ConflictException,
  NotFoundException
} from '@nestjs/common';
import { PostgreSQLErrorCodes } from '../enums/postgreSQLErrorsCodes.enum';
import { DatabaseError } from '../interfaces/databaseError.interface';

@Injectable()
export class ExceptionService {
  private readonly logger = new Logger('ExceptionService');

  handleDBError(error: DatabaseError, context?: string): never {
    this.logError(error, context);
    switch (error.code) {
      case PostgreSQLErrorCodes.UNIQUE_VIOLATION:
        throw new ConflictException(this.getErrorMessage(error.code, error.detail));
      case PostgreSQLErrorCodes.FOREIGN_KEY_VIOLATION:
        throw new BadRequestException(this.getErrorMessage(error.code));
      case PostgreSQLErrorCodes.NOT_NULL_VIOLATION:
        throw new BadRequestException(this.getErrorMessage(error.code));
      case PostgreSQLErrorCodes.INVALID_TEXT_REPRESENTATION:
      case PostgreSQLErrorCodes.INVALID_DATETIME_FORMAT:
        throw new BadRequestException(this.getErrorMessage(error.code));
      default:
        if (error.name === 'EntityNotFound') {
          throw new NotFoundException('Recurso no encontrado');
        }
        throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  private logError(error: any, context?: string): void {
    this.logger.error({
      message: 'Database error occurred',
      errorCode: error.code,
      errorDetail: error.detail,
      constraint: error.constraint,
      table: error.table,
      context: context || 'Unknown',
      timestamp: new Date().toISOString()
    });
  }

  private getErrorMessage(errorCode: string, detail?: string): string {
    const errorMessages = {
      [PostgreSQLErrorCodes.UNIQUE_VIOLATION]: 'Este registro ya existe en el sistema',
      [PostgreSQLErrorCodes.FOREIGN_KEY_VIOLATION]: 'No se puede completar la operación debido a dependencias',
      [PostgreSQLErrorCodes.NOT_NULL_VIOLATION]: 'Faltan campos obligatorios',
      [PostgreSQLErrorCodes.INVALID_TEXT_REPRESENTATION]: 'Formato de datos inválido',
      [PostgreSQLErrorCodes.INVALID_DATETIME_FORMAT]: 'Formato de fecha inválido'
    };

    return errorMessages[errorCode] || 'Error de base de datos';
  }
}