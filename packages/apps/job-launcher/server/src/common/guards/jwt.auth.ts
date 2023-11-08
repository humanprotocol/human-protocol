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
    const useApiKey = this.reflector.getAllAndOverride<boolean>('isApiKey', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (useApiKey) {
      // Use the ApiKeyGuard for API key authentication
      const apiKeyGuard = await this.moduleRef.create(ApiKeyGuard);
      return await apiKeyGuard.canActivate(context);
    }
    // `super` has to be called to set `user` on `request`
    // see https://github.com/nestjs/passport/blob/master/lib/auth.guard.ts
    return (super.canActivate(context) as Promise<boolean>).catch((e) => {
      const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);

      if (isPublic) {
        return true;
      }

      console.error(e);
      throw new UnauthorizedException('Unauthorized');
    });
  }
}
