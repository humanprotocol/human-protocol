/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BadRequestException, Injectable } from '@nestjs/common';
import { EventType } from '../../common/enums/webhook';
import { WebhookDto } from './webhook.dto';
import { JobService } from '../job/job.service';

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

      default:
        throw new BadRequestException(
          `Invalid webhook event type: ${wehbook.eventType}`,
        );
    }
  }
}
