import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../../modules/auth/auth.service';
import { AuthError } from '../errors';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'];

    if (apiKeyHeader) {
      // Splitting the apiKeyHeader to extract apiKeyId
      const parts = apiKeyHeader.split('-');
      if (parts.length === 2) {
        const apiKey = parts[0];
        const apiKeyId = parts[1];

        const userWithApiKey = await this.authService.validateAPIKeyAndGetUser(
          Number(apiKeyId),
          apiKey,
        );
        if (userWithApiKey) {
          request.user = userWithApiKey;
          return true;
        }
      } else {
        throw new AuthError('Invalid API Key');
      }
    }
    throw new AuthError('Unauthorized');
  }
}
