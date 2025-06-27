jest.mock('@human-protocol/sdk');

import { createMock } from '@golevelup/ts-jest';
import { ChainId } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MOCK_ADDRESS,
  MOCK_CVAT_JOB_SIZE,
  MOCK_CVAT_MAX_TIME,
  MOCK_CVAT_SKELETONS_JOB_SIZE_MULTIPLIER,
  MOCK_CVAT_VAL_SIZE,
  MOCK_EXPIRES_IN,
  MOCK_HCAPTCHA_SITE_KEY,
  MOCK_MAX_RETRY_COUNT,
  MOCK_PGP_PASSPHRASE,
  MOCK_PGP_PRIVATE_KEY,
  MOCK_PRIVATE_KEY,
  MOCK_RECORDING_ORACLE_URL,
  MOCK_REPUTATION_ORACLE_URL,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
  MOCK_SECRET,
  MOCK_PAYMENT_PROVIDER_API_VERSION,
  MOCK_PAYMENT_PROVIDER_APP_INFO_URL,
  MOCK_PAYMENT_PROVIDER_SECRET_KEY,
} from '../../../test/constants';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { EventType } from '../../common/enums/webhook';
import { ValidationError } from '../../common/errors';
import { JobRepository } from '../job/job.repository';
import { JobService } from '../job/job.service';
import { Web3Service } from '../web3/web3.service';
import { WebhookController } from './webhook.controller';
import { WebhookDataDto } from './webhook.dto';
import { WebhookRepository } from './webhook.repository';
import { WebhookService } from './webhook.service';

describe('WebhookController', () => {
  let webhookController: WebhookController;
  let jobService: JobService;

  beforeEach(async () => {
    const mockConfig: any = {
      S3_ACCESS_KEY: MOCK_S3_ACCESS_KEY,
      S3_SECRET_KEY: MOCK_S3_SECRET_KEY,
      S3_ENDPOINT: MOCK_S3_ENDPOINT,
      S3_PORT: MOCK_S3_PORT,
      S3_USE_SSL: MOCK_S3_USE_SSL,
      S3_BUCKET: MOCK_S3_BUCKET,
      PGP_PRIVATE_KEY: MOCK_PGP_PRIVATE_KEY,
      PGP_PASSPHRASE: MOCK_PGP_PASSPHRASE,
      REPUTATION_ORACLE_ADDRESS: MOCK_ADDRESS,
      CVAT_EXCHANGE_ORACLE_ADDRESS: MOCK_ADDRESS,
      FORTUNE_EXCHANGE_ORACLE_ADDRESS: MOCK_ADDRESS,
      FORTUNE_RECORDING_ORACLE_ADDRESS: MOCK_ADDRESS,
      WEB3_PRIVATE_KEY: MOCK_PRIVATE_KEY,
      PAYMENT_PROVIDER_SECRET_KEY: MOCK_PAYMENT_PROVIDER_SECRET_KEY,
      PAYMENT_PROVIDER_API_VERSION: MOCK_PAYMENT_PROVIDER_API_VERSION,
      PAYMENT_PROVIDER_APP_INFO_URL: MOCK_PAYMENT_PROVIDER_APP_INFO_URL,
      HCAPTCHA_SITE_KEY: MOCK_HCAPTCHA_SITE_KEY,
      HCAPTCHA_RECORDING_ORACLE_URI: MOCK_RECORDING_ORACLE_URL,
      HCAPTCHA_REPUTATION_ORACLE_URI: MOCK_REPUTATION_ORACLE_URL,
      HCAPTCHA_SECRET: MOCK_SECRET,
      JWT_ACCESS_TOKEN_EXPIRES_IN: MOCK_EXPIRES_IN,
      CVAT_JOB_SIZE: MOCK_CVAT_JOB_SIZE,
      CVAT_MAX_TIME: MOCK_CVAT_MAX_TIME,
      CVAT_VAL_SIZE: MOCK_CVAT_VAL_SIZE,
      CVAT_SKELETONS_JOB_SIZE_MULTIPLIER:
        MOCK_CVAT_SKELETONS_JOB_SIZE_MULTIPLIER,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
            getOrThrow: jest.fn((key: string) => {
              if (!mockConfig[key]) {
                throw new Error(`Configuration key "${key}" does not exist`);
              }
              return mockConfig[key];
            }),
          },
        },
        WebhookService,
        ServerConfigService,
        Web3ConfigService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockResolvedValue({
              address: MOCK_ADDRESS,
              getNetwork: jest
                .fn()
                .mockResolvedValue({ chainId: ChainId.LOCALHOST }),
            }),
          },
        },
        {
          provide: WebhookRepository,
          useValue: createMock<WebhookRepository>(),
        },
        {
          provide: JobRepository,
          useValue: createMock<JobRepository>(),
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'HOST':
                  return '127.0.0.1';
                case 'PORT':
                  return 5000;
                case 'WEB3_PRIVATE_KEY':
                  return MOCK_PRIVATE_KEY;
                case 'MAX_RETRY_COUNT':
                  return MOCK_MAX_RETRY_COUNT;
                default:
                  return null;
              }
            }),
          },
        },
        {
          provide: HttpService,
          useValue: createMock<HttpService>(),
        },
        {
          provide: JobService,
          useValue: createMock<JobService>(),
        },
      ],
    }).compile();

    webhookController = module.get<WebhookController>(WebhookController);
    jobService = module.get<JobService>(JobService);
  });

  describe('Handle Escrow Failure', () => {
    it('should throw an error for invalid manifest URL', async () => {
      // Adjusted to use `reason` field for specifying the error
      const invalidDto: WebhookDataDto = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        eventType: EventType.ESCROW_FAILED,
        eventData: {
          reason: 'Invalid manifest URL',
        },
      };

      jest
        .spyOn(jobService, 'escrowFailedWebhook')
        .mockImplementation(async () => {
          throw new ValidationError('Invalid manifest URL');
        });

      await expect(
        webhookController.processWebhook(invalidDto),
      ).rejects.toThrow(new ValidationError('Invalid manifest URL'));

      expect(jobService.escrowFailedWebhook).toHaveBeenCalledWith(invalidDto);
    });

    it('should throw an error when the manifest cannot be downloaded', async () => {
      const manifestCannotBeDownloadedDto: WebhookDataDto = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        eventType: EventType.ESCROW_FAILED,
        eventData: {
          reason: 'Manifest cannot be downloaded',
        },
      };

      jest
        .spyOn(jobService, 'escrowFailedWebhook')
        .mockImplementation(async () => {
          throw new BadRequestException('Manifest cannot be downloaded');
        });

      await expect(
        webhookController.processWebhook(manifestCannotBeDownloadedDto),
      ).rejects.toThrow(BadRequestException);

      expect(jobService.escrowFailedWebhook).toHaveBeenCalledWith(
        manifestCannotBeDownloadedDto,
      );
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
