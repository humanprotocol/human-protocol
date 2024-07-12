import { SetMetadata } from '@nestjs/common';
import { AuthSignatureRole, Role } from '../enums/role';

export const AllowedRoles = (roles: AuthSignatureRole[] | Role[]) =>
  SetMetadata('roles', roles);
