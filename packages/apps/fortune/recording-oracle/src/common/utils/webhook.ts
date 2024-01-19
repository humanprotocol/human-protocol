import { Logger, NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ErrorJob } from '../constants/errors';
import { signMessage } from './signature';
import { HEADER_SIGNATURE_KEY } from '../constants';
import { WebhookBody } from '@/modules/job/job.dto';
import { CaseConverter } from './case-converter';

export async function sendWebhook(
  httpService: HttpService,
  logger: Logger,
  webhookUrl: string,
  webhookBody: WebhookBody,
  privateKey: string,
): Promise<boolean> {
  const snake_case_body = CaseConverter.transformToSnakeCase(webhookBody);
  const signedBody = await signMessage(snake_case_body, privateKey);
  const { data } = await firstValueFrom(
    await httpService.post(webhookUrl, snake_case_body, {
      headers: { [HEADER_SIGNATURE_KEY]: signedBody },
    }),
  );

  if (!data) {
    logger.log(ErrorJob.WebhookWasNotSent, 'JobService');
    throw new NotFoundException(ErrorJob.WebhookWasNotSent);
  }

  return true;
}
