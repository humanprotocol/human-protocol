import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WhitelistService } from '../../modules/whitelist/whitelist.service';
import { AuthError } from '../errors';

@Injectable()
export class WhitelistAuthGuard implements CanActivate {
  constructor(private readonly whitelistService: WhitelistService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
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
