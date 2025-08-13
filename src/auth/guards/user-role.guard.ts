import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';


import { META_PERMISSIONS } from '../decorators/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {

  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    //obtener permisos requeridos del decorador @RolePortected()
    const validPermissions: string[] = this.reflector.get(META_PERMISSIONS, context.getHandler());
    //si no se pasan parametros por el decorador significa que no son necesarios permisos
    if (!validPermissions || validPermissions.length === 0) {
      return true;
    }

    //obtener el usuario de la request
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new BadRequestException('User not found in request');
    }

    //verificar si el usuario tiene algunos de los permisos requeridos
    for (const permission of user.permissions) {
      if (validPermissions.includes(permission)) {
        return true;
      }
    }
    //si no tiene ningun permiso retorna esto
    throw new ForbiddenException(
      `El usuario ${user.email} necesita uno de estos permisos: [${validPermissions.join(', ')}]`
    );
  }
}
