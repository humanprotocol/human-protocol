import { Injectable } from '@nestjs/common';

import { SlackAuthGuard } from '@/common/guards/slack.auth';
import { SlackConfigService } from '@/config';

@Injectable()
export class AbuseSlackAuthGuard extends SlackAuthGuard {
  constructor(slackConfigService: SlackConfigService) {
    super(slackConfigService.abuseSigningSecret);
  }
}
