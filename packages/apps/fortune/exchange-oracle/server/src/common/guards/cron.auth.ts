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
    const cronSecret = this.configService.get(ConfigNames.CRON_SECRET);
    if (
      cronSecret &&
      request.headers['authorization'] === `Bearer ${cronSecret}`
    ) {
      throw new UnauthorizedException('Unauthorized');
    }
    return true;
  }
}
