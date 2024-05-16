import {
  Injectable,
  ExecutionContext,
  CanActivate,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../../modules/auth/auth.service';
import { ControlledError } from '../errors/controlled';

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
        throw new ControlledError(
          'Invalid API Key format',
          HttpStatus.UNAUTHORIZED,
        );
      }
    }
    throw new ControlledError('Invalid API Key', HttpStatus.UNAUTHORIZED);
  }
}
