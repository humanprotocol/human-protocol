/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@nestjs/common';
import { EventType } from '../../common/enums/webhook';
import { ValidationError } from '../../common/errors';
import { JobService } from '../job/job.service';
import { WebhookDto } from './webhook.dto';

@Injectable()
export class WebhookService {
  constructor(private readonly jobService: JobService) {}

  public async handleWebhook(wehbook: WebhookDto): Promise<void> {
    switch (wehbook.eventType) {
      case EventType.ESCROW_COMPLETED:
        break;

      case EventType.SUBMISSION_IN_REVIEW:
        await this.jobService.processJobSolution(wehbook);
        break;

      case EventType.ESCROW_CANCELED:
        await this.jobService.cancelJob(wehbook);
        break;

      default:
        throw new ValidationError(
          `Invalid webhook event type: ${wehbook.eventType}`,
        );
    }
  }
}
