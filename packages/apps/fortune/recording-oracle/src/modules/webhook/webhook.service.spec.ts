import { Test } from '@nestjs/testing';
import { EventType } from '../../common/enums/webhook';
import { WebhookDto } from './webhook.dto';
import { WebhookService } from './webhook.service';
import { JobService } from '../job/job.service';
import { ConfigModule, registerAs } from '@nestjs/config';
import {
  MOCK_ENCRYPTION_PASSPHRASE,
  MOCK_ENCRYPTION_PRIVATE_KEY,
  MOCK_FILE_URL,
  MOCK_REPUTATION_ORACLE_WEBHOOK_URL,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
  MOCK_WEB3_PRIVATE_KEY,
} from '../../../test/constants';
import { Web3Service } from '../web3/web3.service';
import { of } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { StorageService } from '../storage/storage.service';

describe('WebhookService', () => {
  let webhookService: WebhookService, jobService: JobService;

  const chainId = 1;
  const escrowAddress = '0x1234567890123456789012345678901234567890';

  const signerMock = {
    address: '0x1234567890123456789012345678901234567892',
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  const httpServicePostMock = jest
    .fn()
    .mockReturnValue(of({ status: 200, data: {} }));

  beforeEach(async () => {
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
          registerAs('web3', () => ({
            web3PrivateKey: MOCK_WEB3_PRIVATE_KEY,
          })),
        ),
        ConfigModule.forFeature(
          registerAs('server', () => ({
            reputationOracleWebhookUrl: MOCK_REPUTATION_ORACLE_WEBHOOK_URL,
            encryptionPrivateKey: MOCK_ENCRYPTION_PRIVATE_KEY,
            encryptionPassphrase: MOCK_ENCRYPTION_PASSPHRASE,
          })),
        ),
      ],
      providers: [
        WebhookService,
        JobService,
        StorageService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: httpServicePostMock,
            axiosRef: {
              get: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    webhookService = moduleRef.get<WebhookService>(WebhookService);
    jobService = moduleRef.get<JobService>(JobService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleWebhook', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it('should handle an incoming escrow completed webhook', async () => {
      const webhook: WebhookDto = {
        chainId,
        escrowAddress,
        eventType: EventType.ESCROW_COMPLETED,
      };

      expect(await webhookService.handleWebhook(webhook)).toBe(undefined);
    });

    it('should handle an incoming solution in review webhook', async () => {
      const webhook: WebhookDto = {
        chainId,
        escrowAddress,
        eventType: EventType.SUBMISSION_IN_REVIEW,
        eventData: { solutionsUrl: MOCK_FILE_URL },
      };

      jest
        .spyOn(jobService, 'processJobSolution')
        .mockResolvedValue('Solution are recorded.');

      jest.spyOn(webhookService, 'handleWebhook').mockResolvedValue();

      await webhookService.handleWebhook(webhook);

      expect(webhookService.handleWebhook).toHaveBeenCalledWith(webhook);
    });

    it('should return an error when the event type is invalid', async () => {
      const webhook: WebhookDto = {
        chainId,
        escrowAddress,
        eventType: EventType.ESCROW_RECORDED,
      };

      await expect(webhookService.handleWebhook(webhook)).rejects.toThrow(
        'Invalid webhook event type: escrow_recorded',
      );
    });
  });
});
