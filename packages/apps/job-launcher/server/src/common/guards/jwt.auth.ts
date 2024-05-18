import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyGuard } from './apikey.auth';
import { ControlledError } from '../errors/controlled';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt-http') implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {
    super();
  }

  private async handleApiKeyAuthentication(context: ExecutionContext) {
    const useApiKey = this.reflector.getAllAndOverride<boolean>('isApiKey', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (useApiKey) {
      const apiKeyGuard = await this.moduleRef.create(ApiKeyGuard);
      try {
        return apiKeyGuard.canActivate(context);
      } catch (apiKeyError) {
        console.error('API key auth failed:', apiKeyError);
      }
    }

    throw new ControlledError('Unauthorized', HttpStatus.UNAUTHORIZED);
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
      switch (jwtError?.response?.statusCode) {
        case HttpStatus.UNAUTHORIZED:
          return this.handleApiKeyAuthentication(context);
        case HttpStatus.FORBIDDEN:
          if (jwtError?.response?.message === 'Forbidden') {
            throw new ControlledError('Forbidden', HttpStatus.FORBIDDEN);
          }
          break;
        default:
          throw new ControlledError('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      return false;
    }
  }
}
