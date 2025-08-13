import { SetMetadata } from '@nestjs/common';
import { PermissionsTypes } from '../../users/enums/permissions.enum';

export const META_PERMISSIONS = 'permissions';

export const RoleProtected = (...args: PermissionsTypes[]) => SetMetadata(META_PERMISSIONS, args);
