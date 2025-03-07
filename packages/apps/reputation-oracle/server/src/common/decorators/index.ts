import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/user';

export const Public = (): ((target: any, key?: any, descriptor?: any) => any) =>
  SetMetadata('isPublic', true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
