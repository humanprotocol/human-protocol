import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import logger from '../../logger';
import { WebhookDto } from '../../modules/webhook/webhook.dto';
import { HEADER_SIGNATURE_KEY } from '../constants';
import { CaseConverter } from './case-converter';
import { signMessage } from './signature';
import { formatAxiosError } from './http';

export async function sendWebhook(
  httpService: HttpService,
  webhookUrl: string,
  webhookBody: WebhookDto,
  privateKey: string,
): Promise<boolean> {
  const snake_case_body = CaseConverter.transformToSnakeCase(webhookBody);
  const signedBody = await signMessage(snake_case_body, privateKey);
  try {
    await firstValueFrom(
      httpService.post(webhookUrl, snake_case_body, {
        headers: { [HEADER_SIGNATURE_KEY]: signedBody },
      }),
    );
  } catch (error: any) {
    const formattedError = formatAxiosError(error);
    logger.error('Webhook not sent', {
      webhookUrl,
      error: formattedError,
    });
    throw new Error(formattedError.message);
  }

  return true;
}
