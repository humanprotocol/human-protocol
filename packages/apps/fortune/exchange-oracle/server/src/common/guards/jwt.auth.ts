import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../enums/role';
import { AuthError } from '../errors';
import { JwtUser } from '../types/jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt-http') implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check for public routes first
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Try to authenticate with JWT
    try {
      await super.canActivate(context);
    } catch (jwtError) {
      throw new AuthError('Unauthorized');
    }

    // Roles verification
    let roles = this.reflector.get<Role[]>('roles', context.getHandler());
    if (!roles) roles = [Role.Worker];

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtUser;
    if (!user) {
      throw new AuthError('User not found in request');
    }

    if (!roles.includes(user.role)) {
      throw new AuthError('Invalid role');
    }

    return true;
  }
}
