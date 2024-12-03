import { createMock } from '@golevelup/ts-jest';
import { ChainId, EscrowClient, KVStoreUtils } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  MOCK_ADDRESS,
  MOCK_EXCHANGE_ORACLE_ADDRESS,
  MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
  MOCK_MAX_RETRY_COUNT,
  mockConfig,
} from '../../../test/constants';
import { ErrorWebhook } from '../../common/constants/errors';
import {
  EventType,
  OracleType,
  WebhookStatus,
} from '../../common/enums/webhook';
import { Web3Service } from '../web3/web3.service';
import { WebhookEntity } from './webhook.entity';
import { WebhookRepository } from './webhook.repository';
import { WebhookService } from './webhook.service';
import { of } from 'rxjs';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { JobService } from '../job/job.service';
import { WebhookDataDto } from './webhook.dto';
import { HttpStatus } from '@nestjs/common';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ControlledError } from '../../common/errors/controlled';
import { JobRepository } from '../job/job.repository';
// import { JobRequestType } from '../../common/enums/job';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn(),
  },
}));

describe('WebhookService', () => {
  let webhookService: WebhookService,
    webhookRepository: WebhookRepository,
    web3Service: Web3Service,
    jobService: JobService,
    // jobRepository: JobRepository,
    httpService: HttpService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
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
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        {
          provide: WebhookRepository,
          useValue: createMock<WebhookRepository>(),
        },
        {
          provide: JobService,
          useValue: createMock<JobService>(),
        },
        {
          provide: JobRepository,
          useValue: createMock<JobRepository>(),
        },
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    webhookService = moduleRef.get<WebhookService>(WebhookService);
    webhookRepository = moduleRef.get(WebhookRepository);
    web3Service = moduleRef.get<Web3Service>(Web3Service);
    httpService = moduleRef.get<HttpService>(HttpService);
    jobService = moduleRef.get<JobService>(JobService);
    // jobRepository = moduleRef.get<JobRepository>(JobRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendWebhook', () => {
    const webhookEntity: Partial<WebhookEntity> = {
      id: 1,
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      status: WebhookStatus.PENDING,
      waitUntil: new Date(),
      hasSignature: false,
      oracleType: OracleType.FORTUNE,
      eventType: EventType.ESCROW_CREATED,
    };

    it('should throw an error if webhook url is empty', async () => {
      jest
        .spyOn(webhookService as any, 'getExchangeOracleWebhookUrl')
        .mockResolvedValue('');
      await expect(
        (webhookService as any).sendWebhook(webhookEntity),
      ).rejects.toThrow(
        new ControlledError(ErrorWebhook.UrlNotFound, HttpStatus.NOT_FOUND),
      );
    });

    it('should handle error if any exception is thrown', async () => {
      jest
        .spyOn(webhookService as any, 'getExchangeOracleWebhookUrl')
        .mockResolvedValue(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL);
      jest.spyOn(httpService as any, 'post').mockImplementation(() => {
        return of({
          data: undefined,
        });
      });
      await expect(
        (webhookService as any).sendWebhook(webhookEntity),
      ).rejects.toThrow(
        new ControlledError(ErrorWebhook.NotSent, HttpStatus.NOT_FOUND),
      );
    });

    it('should successfully process a fortune webhook', async () => {
      jest
        .spyOn(webhookService as any, 'getExchangeOracleWebhookUrl')
        .mockResolvedValue(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL);
      jest.spyOn(httpService as any, 'post').mockImplementation(() => {
        return of({
          status: HttpStatus.CREATED,
        });
      });
      expect(await (webhookService as any).sendWebhook(webhookEntity)).toBe(
        undefined,
      );

      expect(httpService.post).toHaveBeenCalledWith(
        MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
        {
          escrow_address: webhookEntity.escrowAddress,
          chain_id: webhookEntity.chainId,
          event_type: webhookEntity.eventType,
        },
        {},
      );
    });

    it('should successfully process a cvat webhook', async () => {
      webhookEntity.oracleType = OracleType.CVAT;
      jest
        .spyOn(webhookService as any, 'getExchangeOracleWebhookUrl')
        .mockResolvedValue(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL);
      jest.spyOn(httpService as any, 'post').mockImplementation(() => {
        return of({
          status: HttpStatus.CREATED,
        });
      });
      expect(await (webhookService as any).sendWebhook(webhookEntity)).toBe(
        undefined,
      );

      expect(httpService.post).toHaveBeenCalledWith(
        MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
        {
          escrow_address: webhookEntity.escrowAddress,
          chain_id: webhookEntity.chainId,
          event_type: webhookEntity.eventType,
        },
        {},
      );
    });

    it('should successfully process a fortune webhook with signature', async () => {
      webhookEntity.oracleType = OracleType.FORTUNE;
      webhookEntity.hasSignature = true;
      jest
        .spyOn(webhookService as any, 'getExchangeOracleWebhookUrl')
        .mockResolvedValue(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL);
      jest.spyOn(httpService as any, 'post').mockImplementation(() => {
        return of({
          status: HttpStatus.CREATED,
        });
      });
      expect(await (webhookService as any).sendWebhook(webhookEntity)).toBe(
        undefined,
      );

      expect(httpService.post).toHaveBeenCalledWith(
        MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
        {
          escrow_address: webhookEntity.escrowAddress,
          chain_id: webhookEntity.chainId,
          event_type: webhookEntity.eventType,
        },
        { headers: { [HEADER_SIGNATURE_KEY]: expect.any(String) } },
      );
    });

    it('should successfully process a cvat webhook with signature', async () => {
      webhookEntity.oracleType = OracleType.CVAT;
      webhookEntity.hasSignature = true;
      jest
        .spyOn(webhookService as any, 'getExchangeOracleWebhookUrl')
        .mockResolvedValue(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL);
      jest.spyOn(httpService as any, 'post').mockImplementation(() => {
        return of({
          status: HttpStatus.CREATED,
        });
      });
      expect(await (webhookService as any).sendWebhook(webhookEntity)).toBe(
        undefined,
      );

      expect(httpService.post).toHaveBeenCalledWith(
        MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
        {
          escrow_address: webhookEntity.escrowAddress,
          chain_id: webhookEntity.chainId,
          event_type: webhookEntity.eventType,
        },
        { headers: { [HEADER_SIGNATURE_KEY]: expect.any(String) } },
      );
    });
  });

  describe('getExchangeOracleWebhookUrl', () => {
    it('should get the exchange oracle webhook URL', async () => {
      web3Service.getSigner = jest.fn().mockReturnValue({
        ...signerMock,
        provider: {
          getLogs: jest.fn().mockResolvedValue([{}]),
          getBlockNumber: jest.fn().mockResolvedValue(100),
        },
      });

      (EscrowClient.build as any).mockImplementation(() => ({
        getExchangeOracleAddress: jest
          .fn()
          .mockResolvedValue(MOCK_EXCHANGE_ORACLE_ADDRESS),
      }));

      KVStoreUtils.get = jest
        .fn()
        .mockResolvedValue(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL);

      const result = await (webhookService as any).getExchangeOracleWebhookUrl(
        MOCK_EXCHANGE_ORACLE_ADDRESS,
        ChainId.LOCALHOST,
      );

      expect(result).toBe(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL);
    });
  });

  describe('handleWebhookError', () => {
    it('should set webhook status to FAILED if retries exceed threshold', async () => {
      const webhookEntity: Partial<WebhookEntity> = {
        id: 1,
        status: WebhookStatus.PENDING,
        retriesCount: MOCK_MAX_RETRY_COUNT,
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

  describe('handleWebhook', () => {
    const chainId = 1;
    const escrowAddress = '0x1234567890123456789012345678901234567890';

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should handle an incoming escrow completed webhook', async () => {
      const webhook: WebhookDataDto = {
        chainId,
        escrowAddress,
        eventType: EventType.ESCROW_COMPLETED,
      };

      jest.spyOn(jobService, 'completeJob');

      expect(await webhookService.handleWebhook(webhook)).toBe(undefined);

      expect(jobService.completeJob).toHaveBeenCalledWith(webhook);
    });

    it('should handle an escrow failed webhook', async () => {
      const webhook: WebhookDataDto = {
        chainId,
        escrowAddress,
        eventType: EventType.ESCROW_FAILED,
        eventData: { reason: 'Manifest cannot be downloaded' },
      };

      jest.spyOn(jobService, 'escrowFailedWebhook');

      expect(await webhookService.handleWebhook(webhook)).toBe(undefined);

      expect(jobService.escrowFailedWebhook).toHaveBeenCalledWith(webhook);
    });

    // it('should handle an incoming abused escrow webhook', async () => {
    //   const webhook: WebhookDataDto = {
    //     chainId,
    //     escrowAddress,
    //     eventType: EventType.ABUSE_DETECTED,
    //   };

    //   jest.spyOn(webhookService, 'createIncomingWebhook');

    //   expect(await webhookService.handleWebhook(webhook)).toBe(undefined);

    //   expect(webhookService.createIncomingWebhook).toHaveBeenCalledWith(
    //     webhook,
    //   );
    // });

    it('should return an error when the event type is invalid', async () => {
      const webhook: WebhookDataDto = {
        chainId,
        escrowAddress,
        eventType: EventType.ESCROW_CANCELED,
      };

      await expect(webhookService.handleWebhook(webhook)).rejects.toThrow(
        new ControlledError(
          'Invalid webhook event type: escrow_canceled',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  // describe('createIncomingWebhook', () => {
  //   it('should create a new incoming webhook', async () => {
  //     const dto = {
  //       chainId: ChainId.LOCALHOST,
  //       escrowAddress: '',
  //     };

  //     jest
  //       .spyOn(jobRepository, 'findOneByChainIdAndEscrowAddress')
  //       .mockResolvedValue({ requestType: JobRequestType.FORTUNE } as any);
  //     jest
  //       .spyOn(jobService, 'getOracleType')
  //       .mockReturnValue(OracleType.FORTUNE);
  //     const result = await webhookService.createIncomingWebhook(dto as any);

  //     expect(result).toBe(undefined);
  //     expect(webhookRepository.createUnique).toHaveBeenCalledWith({
  //       chainId: ChainId.LOCALHOST,
  //       escrowAddress: '',
  //       hasSignature: false,
  //       oracleType: OracleType.FORTUNE,
  //       retriesCount: 0,
  //       status: WebhookStatus.PENDING,
  //       waitUntil: expect.any(Date),
  //     });
  //   });

  //   it('should create a new incoming webhook', async () => {
  //     const dto = {
  //       chainId: ChainId.LOCALHOST,
  //       escrowAddress: '',
  //     };

  //     jest
  //       .spyOn(jobRepository, 'findOneByChainIdAndEscrowAddress')
  //       .mockResolvedValue(undefined as any);

  //     await expect(
  //       webhookService.createIncomingWebhook(dto as any),
  //     ).rejects.toThrow(ErrorWebhook.InvalidEscrow);
  //   });
  // });
});
