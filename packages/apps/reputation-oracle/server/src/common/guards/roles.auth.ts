import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Roles } from '@/common/decorators';
import type { UserRole } from '@/common/enums';
import type { RequestWithUser } from '@/common/types';

@Injectable()
export class RolesAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);

    /**
     * We don't use this guard globally, only on specific routes,
     * so it's just a safety belt
     */
    if (!allowedRoles?.length) {
      throw new Error(
        'Allowed roles must be specified when using RolesAuthGuard',
      );
    }

    const { user } = context.switchToHttp().getRequest() as RequestWithUser;

    if (allowedRoles.includes(user.role as UserRole)) {
      return true;
    }

    throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
  }
}
