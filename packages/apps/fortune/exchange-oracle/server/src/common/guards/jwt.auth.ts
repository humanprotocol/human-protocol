import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../enums/role';
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
    const canActivate = (await super.canActivate(context)) as boolean;
    if (!canActivate) {
      throw new UnauthorizedException('JWT authentication failed');
    }

    // Roles verification
    let roles = this.reflector.get<Role[]>('roles', context.getHandler());
    if (!roles) roles = [Role.Worker];

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtUser;
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }

    if (!roles.includes(user.role)) {
      throw new UnauthorizedException('Invalid role');
    }

    return true;
  }
}
