import { Logger, NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ErrorJob } from '../constants/errors';

export async function sendWebhook(
  httpService: HttpService,
  logger: Logger,
  webhookUrl: string,
  webhookData: any,
): Promise<boolean> {
  const { data } = await firstValueFrom(
    await httpService.post(webhookUrl, webhookData),
  );

  if (!data) {
    logger.log(ErrorJob.WebhookWasNotSent, 'JobService');
    throw new NotFoundException(ErrorJob.WebhookWasNotSent);
  }

  return true;
}
