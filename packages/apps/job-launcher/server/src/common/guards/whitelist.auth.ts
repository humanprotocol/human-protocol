import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { WhitelistService } from '../../modules/whitelist/whitelist.service';
import { AuthError } from '../errors';
import logger from '../../logger';

@Injectable()
export class WhitelistAuthGuard implements CanActivate {
  private readonly logger = logger.child({ context: WhitelistAuthGuard.name });

  constructor(private readonly whitelistService: WhitelistService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.error('User object is missing in the request');
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
