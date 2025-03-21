import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SlackConfigService } from '../../config/slack-config.service';
import { isValidSlackRequest, verifySlackRequest } from '@slack/bolt';
import logger from 'src/logger';

@Injectable()
export class SlackAuthGuard implements CanActivate {
  private readonly logger = logger.child({ context: SlackAuthGuard.name });
  constructor(private readonly slackConfigService: SlackConfigService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    console.log(request.body.payload);
    console.log(request.rawBody);
    try {
      verifySlackRequest({
        signingSecret: this.slackConfigService.signingSecret,
        body: request.body.payload,
        headers: {
          'x-slack-signature': request.headers['x-slack-signature'],
          'x-slack-request-timestamp':
            request.headers['x-slack-request-timestamp'],
        },
      });
    } catch (e) {
      console.error(e);
    }
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
