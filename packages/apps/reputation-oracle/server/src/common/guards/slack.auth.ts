import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SlackConfigService } from '../../config/slack-config.service';
import { isValidSlackRequest } from '@slack/bolt';
import logger from '../../logger';

@Injectable()
export class SlackAuthGuard implements CanActivate {
  private readonly logger = logger.child({ context: SlackAuthGuard.name });
  constructor(private readonly slackConfigService: SlackConfigService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (
      isValidSlackRequest({
        signingSecret: this.slackConfigService.signingSecret,
        body: request.rawBody,
        headers: {
          'x-slack-signature': request.headers['x-slack-signature'],
          'x-slack-request-timestamp':
            request.headers['x-slack-request-timestamp'],
        },
      })
    ) {
      return true;
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
