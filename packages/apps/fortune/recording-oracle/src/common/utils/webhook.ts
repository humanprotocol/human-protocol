import { Logger, NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ErrorJob } from '../constants/errors';
import { signMessage } from './signature';
import { HEADER_SIGNATURE_KEY } from '../constants';
import { WebhookBody } from '@/modules/job/job.dto';

export async function sendWebhook(
  httpService: HttpService,
  logger: Logger,
  webhookUrl: string,
  webhookBody: WebhookBody,
  privateKey: string,
): Promise<boolean> {
  const signedBody = await signMessage(webhookBody, privateKey);
  const { data } = await firstValueFrom(
    await httpService.post(webhookUrl, webhookBody, {
      headers: { [HEADER_SIGNATURE_KEY]: signedBody },
    }),
  );

  if (!data) {
    logger.log(ErrorJob.WebhookWasNotSent, 'JobService');
    throw new NotFoundException(ErrorJob.WebhookWasNotSent);
  }

  return true;
}
