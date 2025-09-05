import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UserRoleGuard } from '../guards/user-role.guard';
import { RoleProtected } from './role-protected.decorator';
import { PermissionsTypes } from 'src/users/enums/permissions.enum';

export const Auth = (...permissions: PermissionsTypes[]) => {
    return applyDecorators(
        RoleProtected(...permissions),
        UseGuards(AuthGuard(), UserRoleGuard),
    )
}