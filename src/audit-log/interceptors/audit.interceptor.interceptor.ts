import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogService } from '../audit-log.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  //logger
  private readonly logger = new Logger(AuditInterceptor.name);

  //inyeccion de audit service
  constructor(private readonly auditService: AuditLogService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    //capturar la request
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method; //GET, POST, PUT, DELETE
    const url = request.url;
    const body = request.body;
    const params = request.params;

    this.logger.debug(`Interceptando request: ${method} ${url}`, {
      userID: user?.id || 'Anonymous',
      hasBody: body ? 'Sí' : 'No',
      params
    });

    // next.handle(): ejecuta la operacion normal (controlador -> servicio) 
    // .pipe(tap(...)) "escucha" cuando termina la operacion
    return next.handle().pipe(
      tap(async (responseData) => {
        if (this.shouldAudit(user, method)) {
          try {
            const auditData = {
              tableName: this.extractTableName(url),
              recordId: this.extractRecordId(responseData, params),
              action: this.mapMethodToAction(method),
              userId: user?.id || 'Anonymous',
              newValues: method !== 'DELETE' ? body : null,
              ipAddress: this.getClientIp(request),
              userAgent: request.get('User-Agent')
            }
            await this.auditService.createAuditLog(auditData);
            this.logger.log(`Audit created for ${auditData.action} on ${auditData.tableName}`);
          } catch (error) {
            //ERROR SILENCIOSO - NO INTERRUMPIR OPERACIÓN PRINCIPAL
            this.logger.error('Failed to create audit log', {
              error: error.message,
              stack: error.stack,
              method,
              url,
              userId: user?.id,
            });
          }
        }
      })
    )
  }

  //determina si debe auditarse
  private shouldAudit(user: any, method: string): boolean {
    return !!user && (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH');
  }

  private extractTableName(url: string): string {
    console.log(url)
    const segments = url.split('/').filter(segment => segment.length > 0);
    return segments[1] || 'unknown';
  }

  private extractRecordId(responseData: any, params: any): string {
    return responseData?.id || params?.id || 'unknown';
  }
  //MAPEAR MÉTODO HTTP A ACCIÓN
  private mapMethodToAction(method: string): string {
    const actionMap = {
      'POST': 'CREATE',
      'PATCH': 'UPDATE',
      'PUT': 'UPDATE',
      'DELETE': 'DELETE',
    };
    return actionMap[method] || 'UNKNOWN';
  }

  //OBTENER IP DEL CLIENTE
  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for'] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }
}
