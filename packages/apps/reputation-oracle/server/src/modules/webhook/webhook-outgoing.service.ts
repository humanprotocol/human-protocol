import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import stringify from 'json-stable-stringify';
import { firstValueFrom } from 'rxjs';

import {
  BACKOFF_INTERVAL_SECONDS,
  HEADER_SIGNATURE_KEY,
} from '../../common/constants';
import { ServerConfigService } from '../../config/server-config.service';
import { Web3ConfigService } from '../../config/web3-config.service';
import { calculateExponentialBackoffMs } from '../../utils/backoff';
import { transformKeysFromCamelToSnake } from '../../utils/case-converters';
import { formatAxiosError } from '../../utils/http';
import { signMessage } from '../../utils/web3';
import logger from '../../logger';

import { OutgoingWebhookStatus } from './types';
import { OutgoingWebhookEntity } from './webhook-outgoing.entity';
import { OutgoingWebhookRepository } from './webhook-outgoing.repository';

@Injectable()
export class OutgoingWebhookService {
  private readonly logger = logger.child({
    context: OutgoingWebhookService.name,
  });

  constructor(
    private readonly httpService: HttpService,
    private readonly outgoingWebhookRepository: OutgoingWebhookRepository,
    private readonly serverConfigService: ServerConfigService,
    private readonly web3ConfigService: Web3ConfigService,
  ) {}

  async createOutgoingWebhook(
    payload: Record<string, unknown>,
    url: string,
  ): Promise<void> {
    const hash = crypto
      .createHash('sha1')
      .update(stringify({ payload, url }) as string)
      .digest('hex');

    let webhookEntity = new OutgoingWebhookEntity();
    webhookEntity.payload = payload;
    webhookEntity.hash = hash;
    webhookEntity.url = url;
    webhookEntity.status = OutgoingWebhookStatus.PENDING;
    webhookEntity.waitUntil = new Date();
    webhookEntity.retriesCount = 0;

    webhookEntity =
      await this.outgoingWebhookRepository.createUnique(webhookEntity);
  }

  private async handleOutgoingWebhookProcessingError(
    webhookEntity: OutgoingWebhookEntity,
    failureDetail: string,
  ): Promise<void> {
    if (webhookEntity.retriesCount < this.serverConfigService.maxRetryCount) {
      const exponentialBackoff = calculateExponentialBackoffMs(
        webhookEntity.retriesCount,
        BACKOFF_INTERVAL_SECONDS,
      );
      webhookEntity.waitUntil = new Date(Date.now() + exponentialBackoff);
      webhookEntity.retriesCount += 1;
    } else {
      webhookEntity.failureDetail = failureDetail;
      webhookEntity.status = OutgoingWebhookStatus.FAILED;
    }
    await this.outgoingWebhookRepository.updateOne(webhookEntity);
  }

  async sendWebhook(outgoingWebhook: OutgoingWebhookEntity): Promise<void> {
    const snake_case_body = transformKeysFromCamelToSnake(
      outgoingWebhook.payload,
    ) as object;
    const signedBody = await signMessage(
      snake_case_body,
      this.web3ConfigService.privateKey,
    );
    try {
      await firstValueFrom(
        this.httpService.post(outgoingWebhook.url, snake_case_body, {
          headers: { [HEADER_SIGNATURE_KEY]: signedBody },
        }),
      );
    } catch (error) {
      const formattedError = formatAxiosError(error);
      this.logger.error('Webhook not sent', {
        error: formattedError,
        hash: outgoingWebhook.hash,
      });
      throw new Error(formattedError.message);
    }
  }

  async processPendingOutgoingWebhooks(): Promise<void> {
    const webhookEntities = await this.outgoingWebhookRepository.findByStatus(
      OutgoingWebhookStatus.PENDING,
    );

    for (const webhookEntity of webhookEntities) {
      try {
        await this.sendWebhook(webhookEntity);
      } catch (error) {
        await this.handleOutgoingWebhookProcessingError(
          webhookEntity,
          `Error message: ${error.message}`,
        );
        continue;
      }
      webhookEntity.status = OutgoingWebhookStatus.SENT;
      await this.outgoingWebhookRepository.updateOne(webhookEntity);
    }
  }
}
