import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
    catch(exception: BadRequestException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse() as any;

        // Manejar errores de validación de class-validator
        let message = exception.message;
        if (typeof exceptionResponse === 'object' && exceptionResponse.message) {
            if (Array.isArray(exceptionResponse.message)) {
                message = exceptionResponse.message.join(', ');
            } else {
                message = exceptionResponse.message;
            }
        }

        response.status(status).json({
            success: false,
            statusCode: status,
            message: message,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}