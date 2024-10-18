/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { HttpStatus, Injectable } from '@nestjs/common';
import { SendWebhookDto, WebhookDto } from './webhook.dto';
import { ErrorWebhook } from '../../common/constants/errors';
import { WebhookRepository } from './webhook.repository';
import { EventType, WebhookStatus } from '../../common/enums';
import { firstValueFrom } from 'rxjs';
import { signMessage } from '../../common/utils/signature';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { HttpService } from '@nestjs/axios';
import { CaseConverter } from '../../common/utils/case-converter';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ControlledError } from '../../common/errors/controlled';
import { WebhookEntity } from './webhook.entity';

@Injectable()
export class WebhookService {
  constructor(
    private readonly httpService: HttpService,
    private readonly webhookRepository: WebhookRepository,
    public readonly serverConfigService: ServerConfigService,
    public readonly web3ConfigService: Web3ConfigService,
  ) {}

  /**
   * Creates a new webhook using the provided data transfer object (DTO).
   *
   * @param {WebhookDto} dto - The data transfer object containing necessary information such as chain ID, escrow address, and webhook type.
   * @returns {Promise<void>} - Resolves to void if the webhook is successfully created.
   * @throws {ControlledError} - Throws an error if the webhook cannot be created.
   */
  public async createWebhook(dto: WebhookDto): Promise<void> {
    let webhookEntity = new WebhookEntity();
    webhookEntity.chainId = dto.chainId;
    webhookEntity.escrowAddress = dto.escrowAddress;
    webhookEntity.type = dto.type;
    webhookEntity.callbackUrl = dto.callbackUrl || null;
    webhookEntity.status = WebhookStatus.PENDING;
    webhookEntity.waitUntil = new Date();
    webhookEntity.retriesCount = 0;

    webhookEntity = await this.webhookRepository.createUnique(webhookEntity);

    if (!webhookEntity) {
      throw new ControlledError(ErrorWebhook.NotCreated, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Handles errors that occur during webhook processing.
   * It logs the error and, based on retry count, updates the webhook status accordingly.
   * @param webhookEntity - The entity representing the webhook data.
   * @param error - The error object thrown during processing.
   * @returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
   */
  public async handleWebhookError(
    webhookEntity: WebhookEntity,
    failedReason: string,
  ): Promise<void> {
    if (webhookEntity.retriesCount < this.serverConfigService.maxRetryCount) {
      webhookEntity.waitUntil = new Date();
      webhookEntity.retriesCount += 1;
    } else {
      webhookEntity.failedReason = failedReason;
      webhookEntity.status = WebhookStatus.FAILED;
    }
    this.webhookRepository.updateOne(webhookEntity);
  }

  public async sendWebhook(
    callbackUrl: string,
    body: SendWebhookDto,
  ): Promise<void> {
    const snake_case_body = CaseConverter.transformToSnakeCase(body);
    const signedBody = await signMessage(
      snake_case_body,
      this.web3ConfigService.privateKey,
    );
    const { status } = await firstValueFrom(
      await this.httpService.post(callbackUrl, snake_case_body, {
        headers: { [HEADER_SIGNATURE_KEY]: signedBody },
      }),
    );

    if (status !== HttpStatus.CREATED) {
      throw new ControlledError(ErrorWebhook.NotSent, HttpStatus.NOT_FOUND);
    }
  }
}
