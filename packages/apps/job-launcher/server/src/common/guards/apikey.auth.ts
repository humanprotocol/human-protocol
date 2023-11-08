import { Injectable, ExecutionContext, UnauthorizedException, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const apiKeyId = request.headers['x-api-key-id'];
  
    if (apiKey && apiKeyId) {
      try {
        const userWithApiKey = await this.authService.validateAPIKeyAndGetUser(Number(apiKeyId), apiKey);
        if (userWithApiKey) {
          request.user = userWithApiKey;
          return true;
        }
      } catch (error) {
        console.error(error);
        throw new UnauthorizedException('Invalid API Key');
      }
    }

    return false;
  }
}
