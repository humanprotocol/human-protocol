import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/user';
import { ROLES_KEY } from '../decorators';
import { ControlledError } from '../errors/controlled';

@Injectable()
export class RolesAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const isAllowed = requiredRoles.some((role) => user.role === role);

    if (isAllowed) {
      return true;
    }

    throw new ControlledError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }
}
