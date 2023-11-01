import { Injectable, ExecutionContext, UnauthorizedException, CanActivate } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ApiKeyService } from '../../modules/auth/apikey.service';

@Injectable()
export class JwtOrApiKeyGuard extends AuthGuard('jwt-http') implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly apiKeyService: ApiKeyService,
  ) {
    super();
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await super.canActivate(context) as boolean;
    } catch (e) {
      const request = context.switchToHttp().getRequest();
      const apiKey = request.headers['x-api-key'];
      const apiKeyId = request.headers['x-api-key-id'];
  
      if (apiKey && apiKeyId) {
        try {
          const userWithApiKey = await this.apiKeyService.validateAPIKeyAndGetUser(Number(apiKeyId), apiKey);
          if (userWithApiKey) {
            request.user = userWithApiKey;
            return true;
          }
        } catch (error) {
          console.error(error);
          // If API Key validation fails, fall back to JWT
        }
      }

      const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);

      if (isPublic) {
        return true;
      }

      console.error(e);
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
