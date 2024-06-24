import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role';

export const AllowedRoles = (roles: Role[]) => SetMetadata('roles', roles);
