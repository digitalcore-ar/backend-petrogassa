import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => {
                const ctx = context.switchToHttp();
                const response = ctx.getResponse();
                const request = ctx.getRequest();

                // Solo formatear respuestas exitosas (200-299)
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    return {
                        success: true,
                        statusCode: response.statusCode,
                        data: data,
                        timestamp: new Date().toISOString(),
                        path: request.url
                    };
                }

                return data;
            }),
        );
    }
}