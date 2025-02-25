import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/user';

export const Public = (): ((target: any, key?: any, descriptor?: any) => any) =>
  SetMetadata('isPublic', true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
