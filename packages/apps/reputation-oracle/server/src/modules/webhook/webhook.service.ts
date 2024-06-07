/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { HttpStatus, Injectable } from '@nestjs/common';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { WebhookDto } from './webhook.dto';
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

@Injectable()
export class WebhookService {
  constructor(
    private readonly httpService: HttpService,
    private readonly webhookRepository: WebhookRepository,
    public readonly serverConfigService: ServerConfigService,
    public readonly web3ConfigService: Web3ConfigService,
  ) {}

  /**
   * Create a incoming webhook using the DTO data.
   * @param dto - Data to create an incoming webhook.
   * @returns {Promise<void>} - Return the boolean result of the method.
   * @throws {Error} - An error object if an error occurred.
   */
  public async createIncomingWebhook(dto: WebhookDto): Promise<void> {
    if (dto.eventType !== EventType.TASK_COMPLETED) {
      throw new ControlledError(
        ErrorWebhook.InvalidEventType,
        HttpStatus.BAD_REQUEST,
      );
    }

    let webhookEntity = new WebhookIncomingEntity();
    webhookEntity.chainId = dto.chainId;
    webhookEntity.escrowAddress = dto.escrowAddress;
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
    webhookEntity: WebhookIncomingEntity,
  ): Promise<void> {
    if (webhookEntity.retriesCount >= this.serverConfigService.maxRetryCount) {
      webhookEntity.status = WebhookStatus.FAILED;
    } else {
      webhookEntity.waitUntil = new Date();
      webhookEntity.retriesCount = webhookEntity.retriesCount + 1;
    }
    this.webhookRepository.updateOne(webhookEntity);
  }

  public async sendWebhook(
    webhookUrl: string,
    webhookBody: WebhookDto,
  ): Promise<void> {
    const snake_case_body = CaseConverter.transformToSnakeCase(webhookBody);
    const signedBody = await signMessage(
      snake_case_body,
      this.web3ConfigService.privateKey,
    );
    const { status } = await firstValueFrom(
      await this.httpService.post(webhookUrl, snake_case_body, {
        headers: { [HEADER_SIGNATURE_KEY]: signedBody },
      }),
    );

    if (status !== HttpStatus.CREATED) {
      throw new ControlledError(ErrorWebhook.NotSent, HttpStatus.NOT_FOUND);
    }
  }
}
