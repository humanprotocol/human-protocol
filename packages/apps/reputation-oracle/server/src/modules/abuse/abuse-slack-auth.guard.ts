import { Injectable } from '@nestjs/common';

import { SlackAuthGuard } from '../../common/guards/slack.auth';
import { SlackConfigService } from '../../config/slack-config.service';

@Injectable()
export class AbuseSlackAuthGuard extends SlackAuthGuard {
  constructor(slackConfigService: SlackConfigService) {
    super(slackConfigService.abuseSigningSecret);
  }
}
