import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SlackConfigService } from '../config/slack-config.service';
import { isValidSlackRequest } from '@slack/bolt';

@Injectable()
export class SlackAuthGuard implements CanActivate {
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
