/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { WebhookDto } from './webhook.dto';
import { ErrorWebhook } from '../../common/constants/errors';
import { WebhookRepository } from './webhook.repository';
import { EventType, WebhookStatus } from '../../common/enums';
import { ConfigService } from '@nestjs/config';
import { ConfigNames } from '../../common/config';
import { firstValueFrom } from 'rxjs';
import { signMessage } from '../../common/utils/signature';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { HttpService } from '@nestjs/axios';
import { CaseConverter } from '../../common/utils/case-converter';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly webhookRepository: WebhookRepository,
    public readonly configService: ConfigService,
  ) {}

  /**
   * Create a incoming webhook using the DTO data.
   * @param dto - Data to create an incoming webhook.
   * @returns {Promise<void>} - Return the boolean result of the method.
   * @throws {Error} - An error object if an error occurred.
   */
  public async createIncomingWebhook(dto: WebhookDto): Promise<void> {
    try {
      if (dto.eventType !== EventType.TASK_COMPLETED) {
        this.logger.log(ErrorWebhook.InvalidEventType, WebhookService.name);
        throw new BadRequestException(ErrorWebhook.InvalidEventType);
      }

      const webhookEntity = await this.webhookRepository.create({
        chainId: dto.chainId,
        escrowAddress: dto.escrowAddress,
        status: WebhookStatus.PENDING,
        waitUntil: new Date(),
        retriesCount: 0,
      });

      if (!webhookEntity) {
        this.logger.log(ErrorWebhook.NotCreated, WebhookService.name);
        throw new NotFoundException(ErrorWebhook.NotCreated);
      }
    } catch (e) {
      throw new Error(e);
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
    if (
      webhookEntity.retriesCount >=
      this.configService.get(ConfigNames.MAX_RETRY_COUNT)
    ) {
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
      this.configService.get(ConfigNames.WEB3_PRIVATE_KEY)!,
    );
    const { status } = await firstValueFrom(
      await this.httpService.post(webhookUrl, snake_case_body, {
        headers: { [HEADER_SIGNATURE_KEY]: signedBody },
      }),
    );

    if (status !== HttpStatus.OK) {
      this.logger.log(ErrorWebhook.NotSent, WebhookService.name);
      throw new NotFoundException(ErrorWebhook.NotSent);
    }
  }
}
