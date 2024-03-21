import { Logger, NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ErrorJob } from '../constants/errors';
import { signMessage } from './signature';
import { HEADER_SIGNATURE_KEY } from '../constants';
import { CaseConverter } from './case-converter';
import { WebhookDto } from '../../modules/webhook/webhook.dto';

export async function sendWebhook(
  httpService: HttpService,
  logger: Logger,
  webhookUrl: string,
  webhookBody: WebhookDto,
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
