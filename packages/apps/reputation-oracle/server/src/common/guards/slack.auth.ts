import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { isValidSlackRequest } from '@slack/bolt';

@Injectable()
export abstract class SlackAuthGuard implements CanActivate {
  constructor(private readonly signingSecret: string) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (
      isValidSlackRequest({
        signingSecret: this.signingSecret,
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

    throw new UnauthorizedException();
  }
}
