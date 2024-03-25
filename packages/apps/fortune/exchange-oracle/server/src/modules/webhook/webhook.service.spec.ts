import { createMock } from '@golevelup/ts-jest';
import { ChainId, EscrowClient, OperatorUtils } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { HttpStatus } from '@nestjs/common';
import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import {
  JOB_LAUNCHER_WEBHOOK_URL,
  MOCK_ADDRESS,
  MOCK_PRIVATE_KEY,
  MOCK_RECORDING_ORACLE_WEBHOOK_URL,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
} from '../../../test/constants';
import {
  DEFAULT_MAX_RETRY_COUNT,
  HEADER_SIGNATURE_KEY,
} from '../../common/constant';
import { ErrorWebhook } from '../../common/constant/errors';
import { EventType, WebhookStatus } from '../../common/enums/webhook';
import { AssignmentRepository } from '../assignment/assignment.repository';
import { JobRepository } from '../job/job.repository';
import { JobService } from '../job/job.service';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { WebhookDto } from './webhook.dto';
import { WebhookEntity } from './webhook.entity';
import { WebhookRepository } from './webhook.repository';
import { WebhookService } from './webhook.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn(),
  },
  OperatorUtils: {
    getLeader: jest.fn(),
  },
  KVStoreClient: {
    build: jest.fn(),
  },
}));

describe('WebhookService', () => {
  let webhookService: WebhookService,
    webhookRepository: WebhookRepository,
    jobService: JobService,
    httpService: HttpService;

  const chainId = 1;
  const escrowAddress = '0x1234567890123456789012345678901234567890';
  const workerAddress = '0x1234567890123456789012345678901234567891';

  const signerMock = {
    address: '0x1234567890123456789012345678901234567892',
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  const configServiceMock: Partial<ConfigService> = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'WEB3_PRIVATE_KEY':
          return MOCK_PRIVATE_KEY;
        case 'MAX_RETRY_COUNT':
          return DEFAULT_MAX_RETRY_COUNT;
      }
    }),
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
      ],
      providers: [
        WebhookService,
        JobService,
        { provide: JobRepository, useValue: createMock<JobRepository>() },
        {
          provide: WebhookRepository,
          useValue: createMock<WebhookRepository>(),
        },
        {
          provide: AssignmentRepository,
          useValue: createMock<AssignmentRepository>(),
        },
        StorageService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
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
    webhookRepository = moduleRef.get(WebhookRepository);
    jobService = moduleRef.get<JobService>(JobService);
    httpService = moduleRef.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleWebhook', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should handle an incoming escrow created webhook', async () => {
      jest.spyOn(jobService, 'createJob').mockResolvedValue();
      const webhook: WebhookDto = {
        chainId,
        escrowAddress,
        eventType: EventType.ESCROW_CREATED,
      };
      expect(await webhookService.handleWebhook(webhook)).toBe(undefined);
      expect(jobService.createJob).toHaveBeenCalledWith(webhook);
    });

    it('should handle an incoming escrow canceled webhook', async () => {
      const webhook: WebhookDto = {
        chainId,
        escrowAddress,
        eventType: EventType.ESCROW_CANCELED,
      };
      expect(await webhookService.handleWebhook(webhook)).toBe(undefined);
    });

    it('should mark a job solution as invalid', async () => {
      const webhook: WebhookDto = {
        chainId,
        escrowAddress,
        eventType: EventType.SUBMISSION_REJECTED,
        eventData: { assignments: [{ assigneeId: workerAddress }] },
      };
      jest.spyOn(jobService, 'processInvalidJobSolution').mockResolvedValue();
      expect(await webhookService.handleWebhook(webhook)).toBe(undefined);
      expect(jobService.processInvalidJobSolution).toHaveBeenCalledWith(
        webhook,
      );
    });

    it('should return an error when the event type is invalid', async () => {
      const webhook: WebhookDto = {
        chainId,
        escrowAddress,
        eventType: EventType.TASK_CREATION_FAILED,
      };
      await expect(webhookService.handleWebhook(webhook)).rejects.toThrow(
        'Invalid webhook event type: task_creation_failed',
      );
    });
  });

  describe('sendWebhook', () => {
    const webhookEntity: Partial<WebhookEntity> = {
      id: 1,
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      status: WebhookStatus.PENDING,
      waitUntil: new Date(),
      eventType: EventType.SUBMISSION_IN_REVIEW,
    };

    it('should throw an error if webhook url is empty', async () => {
      jest
        .spyOn(webhookService as any, 'getOracleWebhookUrl')
        .mockResolvedValue('');
      await expect(
        (webhookService as any).sendWebhook(webhookEntity),
      ).rejects.toThrowError(ErrorWebhook.UrlNotFound);
    });

    it('should handle error if any exception is thrown', async () => {
      jest
        .spyOn(webhookService as any, 'getOracleWebhookUrl')
        .mockResolvedValue(MOCK_RECORDING_ORACLE_WEBHOOK_URL);
      jest.spyOn(httpService as any, 'post').mockImplementation(() => {
        return of({
          data: undefined,
        });
      });
      await expect(
        (webhookService as any).sendWebhook(webhookEntity),
      ).rejects.toThrowError(ErrorWebhook.NotSent);
    });

    it('should successfully process a webhook with signature', async () => {
      jest
        .spyOn(webhookService as any, 'getOracleWebhookUrl')
        .mockResolvedValue(MOCK_RECORDING_ORACLE_WEBHOOK_URL);
      jest.spyOn(httpService as any, 'post').mockImplementation(() => {
        return of({
          status: HttpStatus.CREATED,
        });
      });
      expect(await (webhookService as any).sendWebhook(webhookEntity)).toBe(
        undefined,
      );

      expect(httpService.post).toHaveBeenCalledWith(
        MOCK_RECORDING_ORACLE_WEBHOOK_URL,
        {
          escrow_address: webhookEntity.escrowAddress,
          chain_id: webhookEntity.chainId,
          event_type: webhookEntity.eventType,
          event_data: { solutions_url: expect.any(String) },
        },
        { headers: { [HEADER_SIGNATURE_KEY]: expect.any(String) } },
      );
    });
  });

  describe('getOracleWebhookUrl', () => {
    it('should get the job launcher webhook URL', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getJobLauncherAddress: jest
          .fn()
          .mockResolvedValue(JOB_LAUNCHER_WEBHOOK_URL),
      }));

      (OperatorUtils.getLeader as any).mockResolvedValue({
        webhookUrl: JOB_LAUNCHER_WEBHOOK_URL,
      });

      const result = await (webhookService as any).getOracleWebhookUrl(
        JOB_LAUNCHER_WEBHOOK_URL,
        ChainId.LOCALHOST,
        EventType.TASK_CREATION_FAILED,
      );

      expect(result).toBe(JOB_LAUNCHER_WEBHOOK_URL);
    });

    it('should get the recording oracle webhook URL', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest
          .fn()
          .mockResolvedValue(MOCK_RECORDING_ORACLE_WEBHOOK_URL),
      }));

      (OperatorUtils.getLeader as any).mockResolvedValue({
        webhookUrl: MOCK_RECORDING_ORACLE_WEBHOOK_URL,
      });

      const result = await (webhookService as any).getOracleWebhookUrl(
        MOCK_RECORDING_ORACLE_WEBHOOK_URL,
        ChainId.LOCALHOST,
        EventType.SUBMISSION_IN_REVIEW,
      );

      expect(result).toBe(MOCK_RECORDING_ORACLE_WEBHOOK_URL);
    });

    it('should fail if the event type is not valid', async () => {
      await expect(
        (webhookService as any).getOracleWebhookUrl(
          JOB_LAUNCHER_WEBHOOK_URL,
          ChainId.LOCALHOST,
          EventType.ESCROW_CREATED,
        ),
      ).rejects.toThrowError('Invalid outgoing event type');
    });
  });

  describe('handleWebhookError', () => {
    it('should set webhook status to FAILED if retries exceed threshold', async () => {
      const webhookEntity: Partial<WebhookEntity> = {
        id: 1,
        status: WebhookStatus.PENDING,
        retriesCount: 5,
      };
      await (webhookService as any).handleWebhookError(
        webhookEntity,
        new Error('Sample error'),
      );
      expect(webhookRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity.status).toBe(WebhookStatus.FAILED);
    });

    it('should increment retries count if below threshold', async () => {
      const webhookEntity: Partial<WebhookEntity> = {
        id: 1,
        status: WebhookStatus.PENDING,
        retriesCount: 0,
      };
      await (webhookService as any).handleWebhookError(
        webhookEntity,
        new Error('Sample error'),
      );
      expect(webhookRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity.status).toBe(WebhookStatus.PENDING);
      expect(webhookEntity.retriesCount).toBe(1);
      expect(webhookEntity.waitUntil).toBeInstanceOf(Date);
    });
  });
});
