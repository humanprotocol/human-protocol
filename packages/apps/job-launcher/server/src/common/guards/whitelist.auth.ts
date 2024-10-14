import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { WhitelistService } from '../../modules/whitelist/whitelist.service';
import { ControlledError } from '../errors/controlled';

@Injectable()
export class WhitelistAuthGuard implements CanActivate {
  constructor(private readonly whitelistService: WhitelistService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ControlledError('User not found.', HttpStatus.UNAUTHORIZED);
    }

    const isWhitelisted = await this.whitelistService.isUserWhitelisted(
      user.id,
    );
    if (!isWhitelisted) {
      throw new ControlledError('Unauthorized.', HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}
