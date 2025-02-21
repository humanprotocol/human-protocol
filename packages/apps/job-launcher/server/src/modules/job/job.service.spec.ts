/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createMock } from '@golevelup/ts-jest';
import { Encryption } from '@human-protocol/sdk';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  PaymentCurrency,
  PaymentSource,
  PaymentStatus,
  PaymentType,
} from '../../common/enums/payment';
import {
  JobRequestType,
  JobStatus,
  EscrowFundToken,
} from '../../common/enums/job';
import { MOCK_FILE_HASH, MOCK_FILE_URL } from '../../../test/constants';
import { PaymentService } from '../payment/payment.service';
import { Web3Service } from '../web3/web3.service';
import { JobFortuneDto } from './job.dto';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';
import { WebhookRepository } from '../webhook/webhook.repository';
import { JobService } from './job.service';
import { PaymentRepository } from '../payment/payment.repository';
import { RoutingProtocolService } from './routing-protocol.service';
import { StorageService } from '../storage/storage.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { AuthConfigService } from '../../common/config/auth-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { CvatConfigService } from '../../common/config/cvat-config.service';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { RateService } from '../payment/rate.service';
import { QualificationService } from '../qualification/qualification.service';
import { WhitelistService } from '../whitelist/whitelist.service';
import { generateRandomEthAddress } from '../../../test/utils/address';
import { mul } from '../../common/utils/decimal';

describe('JobService', () => {
  let jobService: JobService,
    paymentService: PaymentService,
    paymentRepository: PaymentRepository,
    jobRepository: JobRepository,
    rateService: RateService;

  beforeAll(async () => {
    jest
      .spyOn(ServerConfigService.prototype, 'minimumFeeUsd', 'get')
      .mockReturnValue(0.01);

    const moduleRef = await Test.createTestingModule({
      providers: [
        JobService,
        Encryption,
        {
          provide: ServerConfigService,
          useValue: new ServerConfigService(new ConfigService()),
        },
        {
          provide: AuthConfigService,
          useValue: createMock<AuthConfigService>(),
        },
        {
          provide: Web3ConfigService,
          useValue: createMock<Web3ConfigService>(),
        },
        {
          provide: CvatConfigService,
          useValue: createMock<CvatConfigService>(),
        },
        {
          provide: PGPConfigService,
          useValue: createMock<PGPConfigService>(),
        },
        {
          provide: QualificationService,
          useValue: createMock<QualificationService>(),
        },
        { provide: Web3Service, useValue: createMock<Web3Service>() },
        {
          provide: RateService,
          useValue: {
            getRate: jest.fn().mockImplementation((from, to) => {
              if (from === PaymentCurrency.USD && to !== PaymentCurrency.USD)
                return Promise.resolve(2);
              if (from !== PaymentCurrency.USD && to === PaymentCurrency.USD)
                return Promise.resolve(0.5);
              return Promise.resolve(1);
            }),
          },
        },
        { provide: JobRepository, useValue: createMock<JobRepository>() },
        {
          provide: WebhookRepository,
          useValue: createMock<WebhookRepository>(),
        },
        {
          provide: PaymentRepository,
          useValue: createMock<PaymentRepository>(),
        },
        { provide: PaymentService, useValue: createMock<PaymentService>() },
        { provide: StorageService, useValue: createMock<StorageService>() },
        { provide: WhitelistService, useValue: createMock<WhitelistService>() },
        {
          provide: RoutingProtocolService,
          useValue: createMock<RoutingProtocolService>(),
        },
        {
          provide: JobModerationService,
          useValue: createMock<JobModerationService>(),
        },
      ],
    }).compile();

    jobService = moduleRef.get<JobService>(JobService);
    paymentService = moduleRef.get<PaymentService>(PaymentService);
    paymentRepository = moduleRef.get<PaymentRepository>(PaymentRepository);
    rateService = moduleRef.get<RateService>(RateService);
    jobRepository = moduleRef.get<JobRepository>(JobRepository);
  });

  describe('createJob', () => {
    const userMock: any = {
      id: 1,
      whitlisted: true,
      stripeCustomerId: 'stripeTest',
    };

    describe('Fortune', () => {
      describe('Successful job creation', () => {
        beforeAll(() => {
          jest
            .spyOn(paymentService, 'getUserBalanceByCurrency')
            .mockResolvedValue(100000000);
        });

        afterEach(() => {
          jest.clearAllMocks();
        });

        it('should create a Fortune job successfully paid and funded with the same currency', async () => {
          const fortuneJobDto: JobFortuneDto = {
            chainId: Math.ceil(Math.random() * 100),
            submissionsRequired: Math.ceil(Math.random() * 10),
            requesterTitle: `Title ${Math.random().toString(36).substring(7)}`,
            requesterDescription: `Description ${Math.random().toString(36).substring(7)}`,
            paymentAmount: Math.random() * 100,
            paymentCurrency: PaymentCurrency.HMT,
            escrowFundToken: EscrowFundToken.HMT,
            exchangeOracle: generateRandomEthAddress(),
            recordingOracle: generateRandomEthAddress(),
            reputationOracle: generateRandomEthAddress(),
          };

          jest.spyOn(jobService, 'uploadManifest').mockResolvedValueOnce({
            url: MOCK_FILE_URL,
            hash: MOCK_FILE_HASH,
          });
          const jobEntityMock = createMock<JobEntity>();
          jobEntityMock.id = 1;
          jest
            .spyOn(jobRepository, 'createUnique')
            .mockResolvedValueOnce(jobEntityMock);

          await jobService.createJob(
            userMock,
            JobRequestType.FORTUNE,
            fortuneJobDto,
          );

          expect(paymentRepository.createUnique).toHaveBeenCalledWith({
            userId: userMock.id,
            jobId: jobEntityMock.id,
            source: PaymentSource.BALANCE,
            type: PaymentType.WITHDRAWAL,
            currency: fortuneJobDto.paymentCurrency,
            amount: expect.any(Number),
            rate: await rateService.getRate(
              fortuneJobDto.paymentCurrency,
              PaymentCurrency.USD,
            ),
            status: PaymentStatus.SUCCEEDED,
          });
          expect(jobRepository.createUnique).toHaveBeenCalledWith({
            chainId: fortuneJobDto.chainId,
            userId: userMock.id,
            manifestUrl: MOCK_FILE_URL,
            manifestHash: MOCK_FILE_HASH,
            requestType: JobRequestType.FORTUNE,
            fee: expect.any(Number),
            fundAmount: fortuneJobDto.paymentAmount,
            status: JobStatus.PENDING,
            waitUntil: expect.any(Date),
            token: fortuneJobDto.escrowFundToken,
            exchangeOracle: fortuneJobDto.exchangeOracle,
            recordingOracle: fortuneJobDto.recordingOracle,
            reputationOracle: fortuneJobDto.reputationOracle,
          });
          expect(jobRepository.updateOne).toHaveBeenCalledTimes(1);
        });

        it('should create a Fortune job successfully paid and funded with different currencies', async () => {
          const fortuneJobDto: JobFortuneDto = {
            chainId: Math.ceil(Math.random() * 100),
            submissionsRequired: Math.ceil(Math.random() * 10),
            requesterTitle: `Title ${Math.random().toString(36).substring(7)}`,
            requesterDescription: `Description ${Math.random().toString(36).substring(7)}`,
            paymentAmount: Math.random() * 100,
            paymentCurrency: PaymentCurrency.USD,
            escrowFundToken: EscrowFundToken.HMT,
            exchangeOracle: generateRandomEthAddress(),
            recordingOracle: generateRandomEthAddress(),
            reputationOracle: generateRandomEthAddress(),
          };

          jest.spyOn(jobService, 'uploadManifest').mockResolvedValueOnce({
            url: MOCK_FILE_URL,
            hash: MOCK_FILE_HASH,
          });
          const jobEntityMock = createMock<JobEntity>();
          jobEntityMock.id = 2;
          jest
            .spyOn(jobRepository, 'createUnique')
            .mockResolvedValueOnce(jobEntityMock);

          const paymentToUsdRate = await rateService.getRate(
            fortuneJobDto.paymentCurrency,
            PaymentCurrency.USD,
          );

          const usdToTokenRate = await rateService.getRate(
            PaymentCurrency.USD,
            fortuneJobDto.escrowFundToken,
          );

          await jobService.createJob(
            userMock,
            JobRequestType.FORTUNE,
            fortuneJobDto,
          );

          expect(paymentRepository.createUnique).toHaveBeenCalledWith({
            userId: userMock.id,
            jobId: jobEntityMock.id,
            source: PaymentSource.BALANCE,
            type: PaymentType.WITHDRAWAL,
            currency: fortuneJobDto.paymentCurrency,
            amount: expect.any(Number),
            rate: paymentToUsdRate,
            status: PaymentStatus.SUCCEEDED,
          });
          expect(jobRepository.createUnique).toHaveBeenCalledWith({
            chainId: fortuneJobDto.chainId,
            userId: userMock.id,
            manifestUrl: MOCK_FILE_URL,
            manifestHash: MOCK_FILE_HASH,
            requestType: JobRequestType.FORTUNE,
            fee: expect.any(Number),
            fundAmount: mul(
              mul(fortuneJobDto.paymentAmount, paymentToUsdRate),
              usdToTokenRate,
            ),
            status: JobStatus.PENDING,
            waitUntil: expect.any(Date),
            token: fortuneJobDto.escrowFundToken,
            exchangeOracle: fortuneJobDto.exchangeOracle,
            recordingOracle: fortuneJobDto.recordingOracle,
            reputationOracle: fortuneJobDto.reputationOracle,
          });
          expect(jobRepository.updateOne).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
