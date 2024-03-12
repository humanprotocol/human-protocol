import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigNames } from '../config';

@Injectable()
export class CronAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (
      request.headers['authorization'] ===
      `Bearer ${this.configService.get(ConfigNames.CRON_SECRET)}`
    ) {
      return true;
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
