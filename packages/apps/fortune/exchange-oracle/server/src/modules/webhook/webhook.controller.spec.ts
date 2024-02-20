import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookDto } from './webhook.dto';
import { Web3Service } from '../web3/web3.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { ConfigModule, registerAs } from '@nestjs/config';
import {
  MOCK_REPUTATION_ORACLE_WEBHOOK_URL,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
  MOCK_SIGNATURE,
} from '../../../test/constants';
import { StorageService } from '../storage/storage.service';
import { verifySignature } from '../../common/utils/signature';
import { EventType } from '../../common/enums/webhook';
import { JobService } from '../job/job.service';

jest.mock('../../common/utils/signature');

describe('webhookController', () => {
  let webhookController: WebhookController;
  let webhookService: WebhookService;

  const chainId = 1;
  const escrowAddress = '0x1234567890123456789012345678901234567890';
  const workerAddress = '0x1234567890123456789012345678901234567891';

  const reputationOracleURL = 'https://example.com/reputationoracle';
  const configServiceMock = {
    get: jest.fn().mockReturnValue(reputationOracleURL),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forFeature(
          registerAs('s3', () => ({
            accessKey: MOCK_S3_ACCESS_KEY,
            secretKey: MOCK_S3_SECRET_KEY,
            endPoint: MOCK_S3_ENDPOINT,
            port: MOCK_S3_PORT,
            useSSL: MOCK_S3_USE_SSL,
            bucket: MOCK_S3_BUCKET,
          })),
        ),
        ConfigModule.forFeature(
          registerAs('server', () => ({
            reputationOracleWebhookUrl: MOCK_REPUTATION_ORACLE_WEBHOOK_URL,
          })),
        ),
      ],
      controllers: [WebhookController],
      providers: [
        WebhookService,
        JobService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue({
              address: '0x1234567890123456789012345678901234567892',
              getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
            }),
          },
        },
        StorageService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn().mockReturnValue(of({ status: 200, data: {} })),
          },
        },
      ],
    }).compile();

    webhookController = moduleRef.get<WebhookController>(WebhookController);
    webhookService = moduleRef.get<WebhookService>(WebhookService);
  });

  describe('processWebhook', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it('should handle an incoming escrow created webhook', async () => {
      const webhook: WebhookDto = {
        chainId,
        escrowAddress,
        eventType: EventType.ESCROW_CREATED,
      };
      jest.spyOn(webhookService, 'handleWebhook');

      (verifySignature as jest.Mock).mockReturnValue(true);

      await webhookController.processWebhook(MOCK_SIGNATURE, webhook);

      expect(webhookService.handleWebhook).toHaveBeenCalledWith(webhook);
    });

    it('should handle an incoming escrow canceled webhook', async () => {
      const webhook: WebhookDto = {
        chainId,
        escrowAddress,
        eventType: EventType.ESCROW_CANCELED,
      };
      jest.spyOn(webhookService, 'handleWebhook');

      (verifySignature as jest.Mock).mockReturnValue(true);

      await webhookController.processWebhook(MOCK_SIGNATURE, webhook);

      expect(webhookService.handleWebhook).toHaveBeenCalledWith(webhook);
    });

    it('should mark a webhook solution as invalid', async () => {
      const webhook: WebhookDto = {
        chainId,
        escrowAddress,
        eventType: EventType.SUBMISSION_REJECTED,
        eventData: [{ assigneeId: workerAddress }],
      };

      jest.spyOn(webhookService, 'handleWebhook').mockResolvedValue();

      (verifySignature as jest.Mock).mockReturnValue(true);

      await webhookController.processWebhook(MOCK_SIGNATURE, webhook);

      expect(webhookService.handleWebhook).toHaveBeenCalledWith(webhook);
    });

    it('should return an error when the event type is invalid', async () => {
      const webhook: WebhookDto = {
        chainId,
        escrowAddress,
        eventType: EventType.TASK_CREATION_FAILED,
      };
      jest.spyOn(webhookService, 'handleWebhook');

      (verifySignature as jest.Mock).mockReturnValue(true);

      await expect(
        webhookController.processWebhook(MOCK_SIGNATURE, webhook),
      ).rejects.toThrow('Invalid webhook event type: task_creation_failed');

      expect(webhookService.handleWebhook).toHaveBeenCalledWith(webhook);
    });
  });
});
