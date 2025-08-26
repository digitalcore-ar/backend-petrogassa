import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
// Interfaz para el error de PostgreSQL
interface PostgresError extends Error {
    code?: string;
    detail?: string;
    column?: string;
    constraint?: string;
    table?: string;
}

@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter {
    catch(exception: QueryFailedError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        const { message, statusCode } = this.parseError(exception);

        response.status(statusCode).json({
            success: false,
            statusCode: statusCode,
            message: message,
            timestamp: new Date().toISOString(),
            path: ctx.getRequest().url,
        });
    }

    private parseError(exception: QueryFailedError): { message: string; statusCode: HttpStatus } {
        // Type casting para acceder a las propiedades de PostgreSQL
        const pgError = exception.driverError as PostgresError;
        const errorCode = pgError?.code;

        switch (errorCode) {
            case '23505': // unique_violation
                return {
                    statusCode: HttpStatus.CONFLICT,
                    message: this.extractUniqueViolationMessage(pgError),
                };

            case '23503': // foreign_key_violation
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'La referencia especificada no existe',
                };

            case '23502': // not_null_violation
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: this.extractNotNullMessage(pgError),
                };

            case '23514': // check_violation
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Los datos no cumplen con las restricciones',
                };

            case 'P0002': // no_data_found
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'El registro solicitado no fue encontrado',
                };

            case '42P01': // undefined_table
                return {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Error de configuración de base de datos',
                };

            case '42703': // undefined_column
                return {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Error de estructura de base de datos',
                };

            case '08006': // connection_failure
                return {
                    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                    message: 'Servicio temporalmente no disponible',
                };

            default:
                return {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Error interno del servidor',
                };
        }
    }
    private extractUniqueViolationMessage(pgError: PostgresError): string {
        const detail = pgError?.detail || '';
        // Extraer el campo y valor del detail
        // Ejemplo: \"Key (patente)=(ABC123) already exists.\"
        const match = detail.match(/Key \\(([^)]+)\\)=\\(([^)]+)\\)/);

        if (match) {
            const [, field, value] = match;
            return `Ya existe un registro con ${field}: ${value}`;
        }

        // Fallback genérico
        return 'Ya existe un registro con estos datos';
    }

    private extractNotNullMessage(pgError: PostgresError): string {
        const column = pgError?.column;

        if (column) {
            return `El campo ${column} es obligatorio`;
        }

        return 'Faltan campos obligatorios';
    }
}