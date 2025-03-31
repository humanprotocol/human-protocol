import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SlackConfigService } from '../../config/slack-config.service';
import { isValidSlackRequest } from '@slack/bolt';

@Injectable()
export class SlackAuthGuard implements CanActivate {
  constructor(private readonly slackConfigService: SlackConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const secrets = this.slackConfigService.signingSecrets;

    const isValid = secrets.some((secret) =>
      isValidSlackRequest({
        signingSecret: secret,
        body: request.rawBody,
        headers: {
          'x-slack-signature': request.headers['x-slack-signature'],
          'x-slack-request-timestamp':
            request.headers['x-slack-request-timestamp'],
        },
      }),
    );

    if (isValid) {
      return true;
    }

    throw new UnauthorizedException();
  }
}
