import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { WhitelistService } from '../../modules/whitelist/whitelist.service';
import { AuthError } from '../errors';

@Injectable()
export class WhitelistAuthGuard implements CanActivate {
  private readonly logger = new Logger(WhitelistAuthGuard.name);

  constructor(private readonly whitelistService: WhitelistService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.error('User object is missing in the request.', request);
      throw new AuthError('User not found.');
    }

    const isWhitelisted = await this.whitelistService.isUserWhitelisted(
      user.id,
    );
    if (!isWhitelisted) {
      throw new AuthError('Unauthorized.');
    }

    return true;
  }
}
