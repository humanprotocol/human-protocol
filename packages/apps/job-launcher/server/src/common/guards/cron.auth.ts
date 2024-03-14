import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CommonConfigService } from '../config';

@Injectable()
export class CronAuthGuard implements CanActivate {
  constructor(private readonly commonConfiService: CommonConfigService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (
      request.headers['authorization'] ===
      `Bearer ${this.commonConfiService.cronSecret}`
    ) {
      return true;
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
