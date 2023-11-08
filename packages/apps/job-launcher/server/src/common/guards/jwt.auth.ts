import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyGuard } from './apikey.auth';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt-http') implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {
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
      // `super` has to be called to set `user` on `request`
      // see https://github.com/nestjs/passport/blob/master/lib/auth.guard.ts
      return (await super.canActivate(context)) as boolean;
    } catch (jwtError) {
      // If JWT fails, try API key authentication if it's allowed for this route
      const useApiKey = this.reflector.getAllAndOverride<boolean>('isApiKey', [
        context.getHandler(),
        context.getClass(),
      ]);

      if (useApiKey) {
        const apiKeyGuard = await this.moduleRef.create(ApiKeyGuard);
        try {
          return await apiKeyGuard.canActivate(context);
        } catch (apiKeyError) {
          // If API key also fails, log the error and throw an UnauthorizedException
          console.error('API key auth failed:', apiKeyError);
        }
      }

      // If both JWT and API key authentication failed, log the JWT error and throw an UnauthorizedException
      console.error('JWT auth failed:', jwtError);
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
