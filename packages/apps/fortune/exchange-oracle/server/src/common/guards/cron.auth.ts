import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ServerConfigService } from '../config/server-config.service';

@Injectable()
export class CronAuthGuard implements CanActivate {
  constructor(private serverConfigService: ServerConfigService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (
      request.headers['authorization'] !==
      `Bearer ${this.serverConfigService.cronSecret}`
    ) {
      throw new UnauthorizedException('Unauthorized');
    }
    return true;
  }
}
