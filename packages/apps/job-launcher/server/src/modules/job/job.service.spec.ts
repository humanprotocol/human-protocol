/* eslint-disable @typescript-eslint/no-non-null-assertion */
jest.mock('@human-protocol/sdk');

import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import {
  ChainId,
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  IEscrow,
  KVStoreUtils,
  NETWORKS,
} from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';
import { ethers, Wallet, ZeroAddress } from 'ethers';
import { createSignerMock } from '../../../test/fixtures/web3';
import { ServerConfigService } from '../../common/config/server-config.service';
import { ErrorEscrow, ErrorJob } from '../../common/constants/errors';
import {
  AudinoJobType,
  CvatJobType,
  EscrowFundToken,
  FortuneJobType,
  HCaptchaJobType,
  JobStatus,
  JobStatusFilter,
} from '../../common/enums/job';
import { PaymentCurrency, PaymentType } from '../../common/enums/payment';
import {
  EventType,
  OracleType,
  WebhookStatus,
} from '../../common/enums/webhook';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../common/errors';
import { div, max, mul } from '../../common/utils/decimal';
import { getTokenDecimals } from '../../common/utils/tokens';
import {
  createMockAudinoManifest,
  createMockCvatManifest,
  createMockFortuneManifest,
  createMockHcaptchaManifest,
} from '../manifest/fixtures';
import { ManifestService } from '../manifest/manifest.service';
import { PaymentRepository } from '../payment/payment.repository';
import { PaymentService } from '../payment/payment.service';
import { QualificationService } from '../qualification/qualification.service';
import { RateService } from '../rate/rate.service';
import { RoutingProtocolService } from '../routing-protocol/routing-protocol.service';
import { StorageService } from '../storage/storage.service';
import { createUser } from '../user/fixtures';
import { Web3Service } from '../web3/web3.service';
import { WebhookRepository } from '../webhook/webhook.repository';
import { WhitelistEntity } from '../whitelist/whitelist.entity';
import { WhitelistService } from '../whitelist/whitelist.service';
import {
  createAudinoJobDto,
  createCaptchaJobDto,
  createCvatJobDto,
  createFortuneJobDto,
  createJobEntity,
} from './fixtures';
import {
  FortuneFinalResultDto,
  GetJobsDto,
  JobFortuneDto,
  JobQuickLaunchDto,
} from './job.dto';
import { JobRepository } from './job.repository';
import { JobService } from './job.service';

const mockServerConfigService = createMock<ServerConfigService>();
const mockQualificationService = createMock<QualificationService>();
const mockWeb3Service = createMock<Web3Service>();
const mockJobRepository = createMock<JobRepository>();
const mockWebhookRepository = createMock<WebhookRepository>();
const mockPaymentRepository = createMock<PaymentRepository>();
const mockStorageService = createMock<StorageService>();
const mockPaymentService = createMock<PaymentService>();
const mockRateService = createMock<RateService>();
const mockRoutingProtocolService = createMock<RoutingProtocolService>();
const mockManifestService = createMock<ManifestService>();
const mockWhitelistService = createMock<WhitelistService>();

const mockedEscrowClient = jest.mocked(EscrowClient);
const mockedEscrowUtils = jest.mocked(EscrowUtils);
const mockedKVStoreUtils = jest.mocked(KVStoreUtils);

describe('JobService', () => {
  const tokenToUsdRate = 2;
  const usdToTokenRate = 0.5;
  let jobService: JobService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JobService,
        {
          provide: ServerConfigService,
          useValue: mockServerConfigService,
        },
        {
          provide: QualificationService,
          useValue: mockQualificationService,
        },
        { provide: Web3Service, useValue: mockWeb3Service },
        {
          provide: RateService,
          useValue: mockRateService,
        },
        { provide: JobRepository, useValue: mockJobRepository },
        {
          provide: WebhookRepository,
          useValue: mockWebhookRepository,
        },
        {
          provide: PaymentRepository,
          useValue: mockPaymentRepository,
        },
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: WhitelistService, useValue: mockWhitelistService },
        {
          provide: RoutingProtocolService,
          useValue: mockRoutingProtocolService,
        },
        {
          provide: ManifestService,
          useValue: mockManifestService,
        },
      ],
    }).compile();

    jobService = moduleRef.get<JobService>(JobService);

    (mockServerConfigService['minimumFeeUsd'] as any) = 0.01;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    const userMock = createUser({ whitelist: new WhitelistEntity() });

    describe('Fortune', () => {
      it('should create a Fortune job successfully paid and funded with the same currency', async () => {
        const fortuneJobDto: JobFortuneDto = createFortuneJobDto({
          paymentCurrency: PaymentCurrency.HMT,
          escrowFundToken: EscrowFundToken.HMT,
        });
        const fundTokenDecimals = getTokenDecimals(
          fortuneJobDto.chainId!,
          fortuneJobDto.escrowFundToken,
        );

        const mockManifest = createMockFortuneManifest({
          submissionsRequired: fortuneJobDto.submissionsRequired,
          requesterTitle: fortuneJobDto.requesterTitle,
          requesterDescription: fortuneJobDto.requesterDescription,
          fundAmount: fortuneJobDto.paymentAmount,
        });
        mockManifestService.createManifest.mockResolvedValueOnce(mockManifest);
        const mockUrl = faker.internet.url();
        const mockHash = faker.string.uuid();
        mockManifestService.uploadManifest.mockResolvedValueOnce({
          url: mockUrl,
          hash: mockHash,
        });
        const jobEntityMock = createJobEntity();
        mockJobRepository.updateOne.mockResolvedValueOnce(jobEntityMock);
        mockRateService.getRate
          .mockResolvedValueOnce(tokenToUsdRate)
          .mockResolvedValueOnce(usdToTokenRate);
        mockedKVStoreUtils.get.mockResolvedValueOnce('1');

        const result = await jobService.createJob(
          userMock,
          FortuneJobType.FORTUNE,
          fortuneJobDto,
        );

        const paymentCurrencyFee = Number(
          max(
            div(mockServerConfigService.minimumFeeUsd, tokenToUsdRate),
            mul(div(1, 100), fortuneJobDto.paymentAmount),
          ).toFixed(18),
        );

        expect(result).toBe(jobEntityMock.id);
        expect(mockWeb3Service.validateChainId).toHaveBeenCalledWith(
          fortuneJobDto.chainId,
        );
        expect(mockRoutingProtocolService.selectOracles).not.toHaveBeenCalled();
        expect(mockRoutingProtocolService.validateOracles).toHaveBeenCalledWith(
          fortuneJobDto.chainId,
          FortuneJobType.FORTUNE,
          fortuneJobDto.reputationOracle,
          fortuneJobDto.exchangeOracle,
          fortuneJobDto.recordingOracle,
        );
        expect(mockManifestService.createManifest).toHaveBeenCalledWith(
          fortuneJobDto,
          FortuneJobType.FORTUNE,
          fortuneJobDto.paymentAmount,
          fundTokenDecimals,
        );
        expect(mockManifestService.uploadManifest).toHaveBeenCalledWith(
          fortuneJobDto.chainId,
          mockManifest,
          [
            fortuneJobDto.exchangeOracle,
            fortuneJobDto.reputationOracle,
            fortuneJobDto.recordingOracle,
          ],
        );
        expect(mockPaymentService.createWithdrawalPayment).toHaveBeenCalledWith(
          userMock.id,
          expect.any(Number),
          fortuneJobDto.paymentCurrency,
          tokenToUsdRate,
        );
        expect(mockJobRepository.updateOne).toHaveBeenCalledWith({
          chainId: fortuneJobDto.chainId,
          userId: userMock.id,
          manifestUrl: mockUrl,
          manifestHash: mockHash,
          requestType: FortuneJobType.FORTUNE,
          fee: Number(
            mul(
              mul(paymentCurrencyFee, tokenToUsdRate),
              usdToTokenRate,
            ).toFixed(fundTokenDecimals),
          ),
          fundAmount: fortuneJobDto.paymentAmount,
          status: JobStatus.MODERATION_PASSED,
          waitUntil: expect.any(Date),
          token: fortuneJobDto.escrowFundToken,
          exchangeOracle: fortuneJobDto.exchangeOracle,
          recordingOracle: fortuneJobDto.recordingOracle,
          reputationOracle: fortuneJobDto.reputationOracle,
          payments: expect.any(Array),
        });
      });

      it('should create a Fortune job successfully paid and funded with different currencies', async () => {
        const fortuneJobDto: JobFortuneDto = createFortuneJobDto({
          paymentCurrency: PaymentCurrency.USD,
          escrowFundToken: EscrowFundToken.HMT,
        });

        const fundTokenDecimals = getTokenDecimals(
          fortuneJobDto.chainId!,
          fortuneJobDto.escrowFundToken,
        );

        const mockManifest = createMockFortuneManifest({
          submissionsRequired: fortuneJobDto.submissionsRequired,
          requesterTitle: fortuneJobDto.requesterTitle,
          requesterDescription: fortuneJobDto.requesterDescription,
          fundAmount: fortuneJobDto.paymentAmount,
        });
        mockManifestService.createManifest.mockResolvedValueOnce(mockManifest);
        const mockUrl = faker.internet.url();
        const mockHash = faker.string.uuid();
        mockManifestService.uploadManifest.mockResolvedValueOnce({
          url: mockUrl,
          hash: mockHash,
        });
        const jobEntityMock = createJobEntity();
        mockJobRepository.updateOne.mockResolvedValueOnce(jobEntityMock);
        mockRateService.getRate
          .mockResolvedValueOnce(tokenToUsdRate)
          .mockResolvedValueOnce(usdToTokenRate);
        mockedKVStoreUtils.get.mockResolvedValueOnce('1');

        const result = await jobService.createJob(
          userMock,
          FortuneJobType.FORTUNE,
          fortuneJobDto,
        );

        const paymentCurrencyFee = Number(
          max(
            div(mockServerConfigService.minimumFeeUsd, tokenToUsdRate),
            mul(div(1, 100), fortuneJobDto.paymentAmount),
          ).toFixed(18),
        );

        expect(result).toBe(jobEntityMock.id);

        expect(mockWeb3Service.validateChainId).toHaveBeenCalledWith(
          fortuneJobDto.chainId,
        );
        expect(mockRoutingProtocolService.selectOracles).not.toHaveBeenCalled();
        expect(mockRoutingProtocolService.validateOracles).toHaveBeenCalledWith(
          fortuneJobDto.chainId,
          FortuneJobType.FORTUNE,
          fortuneJobDto.reputationOracle,
          fortuneJobDto.exchangeOracle,
          fortuneJobDto.recordingOracle,
        );
        expect(mockManifestService.createManifest).toHaveBeenCalledWith(
          fortuneJobDto,
          FortuneJobType.FORTUNE,
          Number(fortuneJobDto.paymentAmount.toFixed(6)),
          fundTokenDecimals,
        );
        expect(mockManifestService.uploadManifest).toHaveBeenCalledWith(
          fortuneJobDto.chainId,
          mockManifest,
          [
            fortuneJobDto.exchangeOracle,
            fortuneJobDto.reputationOracle,
            fortuneJobDto.recordingOracle,
          ],
        );
        expect(mockPaymentService.createWithdrawalPayment).toHaveBeenCalledWith(
          userMock.id,
          expect.any(Number),
          fortuneJobDto.paymentCurrency,
          tokenToUsdRate,
        );
        expect(mockJobRepository.updateOne).toHaveBeenCalledWith({
          chainId: fortuneJobDto.chainId,
          userId: userMock.id,
          manifestUrl: mockUrl,
          manifestHash: mockHash,
          requestType: FortuneJobType.FORTUNE,
          fee: Number(
            mul(
              mul(paymentCurrencyFee, tokenToUsdRate),
              usdToTokenRate,
            ).toFixed(fundTokenDecimals),
          ),
          fundAmount: Number(
            mul(
              mul(fortuneJobDto.paymentAmount, tokenToUsdRate),
              usdToTokenRate,
            ).toFixed(6),
          ),
          status: JobStatus.MODERATION_PASSED,
          waitUntil: expect.any(Date),
          token: fortuneJobDto.escrowFundToken,
          exchangeOracle: fortuneJobDto.exchangeOracle,
          recordingOracle: fortuneJobDto.recordingOracle,
          reputationOracle: fortuneJobDto.reputationOracle,
          payments: expect.any(Array),
        });
      });

      it('should select the right oracles when no oracle addresses provided', async () => {
        const fortuneJobDto: JobFortuneDto = createFortuneJobDto({
          paymentCurrency: EscrowFundToken.HMT,
          escrowFundToken: EscrowFundToken.HMT,
          exchangeOracle: null,
          recordingOracle: null,
          reputationOracle: null,
        });

        const fundTokenDecimals = getTokenDecimals(
          fortuneJobDto.chainId!,
          fortuneJobDto.escrowFundToken,
        );

        const mockManifest = createMockFortuneManifest({
          submissionsRequired: fortuneJobDto.submissionsRequired,
          requesterTitle: fortuneJobDto.requesterTitle,
          requesterDescription: fortuneJobDto.requesterDescription,
          fundAmount: fortuneJobDto.paymentAmount,
        });
        mockManifestService.createManifest.mockResolvedValueOnce(mockManifest);
        const mockUrl = faker.internet.url();
        const mockHash = faker.string.uuid();
        mockManifestService.uploadManifest.mockResolvedValueOnce({
          url: mockUrl,
          hash: mockHash,
        });
        const jobEntityMock = createJobEntity();
        mockJobRepository.updateOne.mockResolvedValueOnce(jobEntityMock);
        mockRateService.getRate
          .mockResolvedValueOnce(tokenToUsdRate)
          .mockResolvedValueOnce(usdToTokenRate);
        const mockOracles = {
          recordingOracle: faker.finance.ethereumAddress(),
          exchangeOracle: faker.finance.ethereumAddress(),
          reputationOracle: faker.finance.ethereumAddress(),
        };
        mockRoutingProtocolService.selectOracles.mockResolvedValueOnce({
          recordingOracle: mockOracles.recordingOracle,
          exchangeOracle: mockOracles.exchangeOracle,
          reputationOracle: mockOracles.reputationOracle,
        });
        mockedKVStoreUtils.get.mockResolvedValueOnce('1');

        const result = await jobService.createJob(
          userMock,
          FortuneJobType.FORTUNE,
          fortuneJobDto,
        );
        const paymentCurrencyFee = Number(
          max(
            div(mockServerConfigService.minimumFeeUsd, tokenToUsdRate),
            mul(div(1, 100), fortuneJobDto.paymentAmount),
          ).toFixed(18),
        );

        expect(result).toBe(jobEntityMock.id);

        expect(mockWeb3Service.validateChainId).toHaveBeenCalledWith(
          fortuneJobDto.chainId,
        );
        expect(mockRoutingProtocolService.selectOracles).toHaveBeenCalledWith(
          fortuneJobDto.chainId,
          FortuneJobType.FORTUNE,
        );
        expect(
          mockRoutingProtocolService.validateOracles,
        ).not.toHaveBeenCalled();
        expect(mockManifestService.createManifest).toHaveBeenCalledWith(
          fortuneJobDto,
          FortuneJobType.FORTUNE,
          fortuneJobDto.paymentAmount,
          fundTokenDecimals,
        );
        expect(mockManifestService.uploadManifest).toHaveBeenCalledWith(
          fortuneJobDto.chainId,
          mockManifest,
          [
            mockOracles.exchangeOracle,
            mockOracles.reputationOracle,
            mockOracles.recordingOracle,
          ],
        );
        expect(mockPaymentService.createWithdrawalPayment).toHaveBeenCalledWith(
          userMock.id,
          expect.any(Number),
          fortuneJobDto.paymentCurrency,
          tokenToUsdRate,
        );
        expect(mockJobRepository.updateOne).toHaveBeenCalledWith({
          chainId: fortuneJobDto.chainId,
          userId: userMock.id,
          manifestUrl: mockUrl,
          manifestHash: mockHash,
          requestType: FortuneJobType.FORTUNE,
          fee: Number(
            mul(
              mul(paymentCurrencyFee, tokenToUsdRate),
              usdToTokenRate,
            ).toFixed(fundTokenDecimals),
          ),
          fundAmount: fortuneJobDto.paymentAmount,
          status: JobStatus.MODERATION_PASSED,
          waitUntil: expect.any(Date),
          token: fortuneJobDto.escrowFundToken,
          exchangeOracle: mockOracles.exchangeOracle,
          recordingOracle: mockOracles.recordingOracle,
          reputationOracle: mockOracles.reputationOracle,
          payments: expect.any(Array),
        });
      });

      it('should throw if user is not whitelisted and has no payment method', async () => {
        mockWhitelistService.isUserWhitelisted.mockResolvedValueOnce(false);
        const fortuneJobDto: JobFortuneDto = createFortuneJobDto();
        await expect(
          jobService.createJob(
            createUser({ paymentProviderId: null }),
            FortuneJobType.FORTUNE,
            fortuneJobDto,
          ),
        ).rejects.toThrow(new ValidationError(ErrorJob.NotActiveCard));
      });

      it('should re-throw errors from validateChainId', async () => {
        const randomError = new Error(faker.lorem.word());
        mockWeb3Service.validateChainId.mockImplementationOnce(() => {
          throw randomError;
        });
        const dto = createFortuneJobDto();
        await expect(
          jobService.createJob(createUser(), FortuneJobType.FORTUNE, dto),
        ).rejects.toThrow(randomError);
      });
    });

    describe('CVAT', () => {
      it('should create a CVAT job', async () => {
        const cvatJobDto = createCvatJobDto();
        const fundTokenDecimals = getTokenDecimals(
          cvatJobDto.chainId!,
          cvatJobDto.escrowFundToken,
        );

        const mockManifest = createMockCvatManifest();
        mockManifestService.createManifest.mockResolvedValueOnce(mockManifest);
        const mockUrl = faker.internet.url();
        const mockHash = faker.string.uuid();
        mockManifestService.uploadManifest.mockResolvedValueOnce({
          url: mockUrl,
          hash: mockHash,
        });
        const jobEntityMock = createJobEntity();
        mockJobRepository.createUnique = jest
          .fn()
          .mockResolvedValueOnce(jobEntityMock);
        mockRateService.getRate
          .mockResolvedValueOnce(tokenToUsdRate)
          .mockResolvedValueOnce(usdToTokenRate);

        await jobService.createJob(userMock, cvatJobDto.type, cvatJobDto);

        expect(mockWeb3Service.validateChainId).toHaveBeenCalledWith(
          cvatJobDto.chainId,
        );
        expect(mockRoutingProtocolService.selectOracles).not.toHaveBeenCalled();
        expect(mockRoutingProtocolService.validateOracles).toHaveBeenCalledWith(
          cvatJobDto.chainId,
          cvatJobDto.type,
          cvatJobDto.reputationOracle,
          cvatJobDto.exchangeOracle,
          cvatJobDto.recordingOracle,
        );
        expect(mockManifestService.createManifest).toHaveBeenCalledWith(
          cvatJobDto,
          cvatJobDto.type,
          cvatJobDto.paymentAmount,
          fundTokenDecimals,
        );
        expect(mockManifestService.uploadManifest).toHaveBeenCalledWith(
          cvatJobDto.chainId,
          mockManifest,
          [
            cvatJobDto.exchangeOracle,
            cvatJobDto.reputationOracle,
            cvatJobDto.recordingOracle,
          ],
        );
        expect(mockPaymentService.createWithdrawalPayment).toHaveBeenCalledWith(
          userMock.id,
          expect.any(Number),
          cvatJobDto.paymentCurrency,
          tokenToUsdRate,
        );
        expect(mockJobRepository.updateOne).toHaveBeenCalledWith({
          chainId: cvatJobDto.chainId,
          userId: userMock.id,
          manifestUrl: mockUrl,
          manifestHash: mockHash,
          requestType: cvatJobDto.type,
          fee: expect.any(Number),
          fundAmount: Number(
            mul(
              mul(cvatJobDto.paymentAmount, tokenToUsdRate),
              usdToTokenRate,
            ).toFixed(6),
          ),
          status: JobStatus.MODERATION_PASSED,
          waitUntil: expect.any(Date),
          token: cvatJobDto.escrowFundToken,
          exchangeOracle: cvatJobDto.exchangeOracle,
          recordingOracle: cvatJobDto.recordingOracle,
          reputationOracle: cvatJobDto.reputationOracle,
          payments: expect.any(Array),
        });
      });
    });

    describe('Audino', () => {
      it('should create an Audino job', async () => {
        const audinoJobDto = createAudinoJobDto();
        const fundTokenDecimals = getTokenDecimals(
          audinoJobDto.chainId!,
          audinoJobDto.escrowFundToken,
        );

        const mockManifest = createMockAudinoManifest();
        mockManifestService.createManifest.mockResolvedValueOnce(mockManifest);
        const mockUrl = faker.internet.url();
        const mockHash = faker.string.uuid();
        mockManifestService.uploadManifest.mockResolvedValueOnce({
          url: mockUrl,
          hash: mockHash,
        });
        const jobEntityMock = createJobEntity();
        mockJobRepository.createUnique = jest
          .fn()
          .mockResolvedValueOnce(jobEntityMock);
        mockRateService.getRate
          .mockResolvedValueOnce(tokenToUsdRate)
          .mockResolvedValueOnce(usdToTokenRate);

        await jobService.createJob(
          userMock,
          AudinoJobType.AUDIO_TRANSCRIPTION,
          audinoJobDto,
        );

        expect(mockWeb3Service.validateChainId).toHaveBeenCalledWith(
          audinoJobDto.chainId,
        );
        expect(mockRoutingProtocolService.selectOracles).not.toHaveBeenCalled();
        expect(mockRoutingProtocolService.validateOracles).toHaveBeenCalledWith(
          audinoJobDto.chainId,
          audinoJobDto.type,
          audinoJobDto.reputationOracle,
          audinoJobDto.exchangeOracle,
          audinoJobDto.recordingOracle,
        );
        expect(mockManifestService.createManifest).toHaveBeenCalledWith(
          audinoJobDto,
          audinoJobDto.type,
          audinoJobDto.paymentAmount,
          fundTokenDecimals,
        );
        expect(mockManifestService.uploadManifest).toHaveBeenCalledWith(
          audinoJobDto.chainId,
          mockManifest,
          [
            audinoJobDto.exchangeOracle,
            audinoJobDto.reputationOracle,
            audinoJobDto.recordingOracle,
          ],
        );
        expect(mockPaymentService.createWithdrawalPayment).toHaveBeenCalledWith(
          userMock.id,
          expect.any(Number),
          audinoJobDto.paymentCurrency,
          tokenToUsdRate,
        );
        expect(mockJobRepository.updateOne).toHaveBeenCalledWith({
          chainId: audinoJobDto.chainId,
          userId: userMock.id,
          manifestUrl: mockUrl,
          manifestHash: mockHash,
          requestType: audinoJobDto.type,
          fee: expect.any(Number),
          fundAmount: Number(
            mul(
              mul(audinoJobDto.paymentAmount, tokenToUsdRate),
              usdToTokenRate,
            ).toFixed(6),
          ),
          status: JobStatus.MODERATION_PASSED,
          waitUntil: expect.any(Date),
          token: audinoJobDto.escrowFundToken,
          exchangeOracle: audinoJobDto.exchangeOracle,
          recordingOracle: audinoJobDto.recordingOracle,
          reputationOracle: audinoJobDto.reputationOracle,
          payments: expect.any(Array),
        });
      });
    });

    describe('HCaptcha', () => {
      it('should create an HCaptcha job', async () => {
        const captchaJobDto = createCaptchaJobDto();
        const fundTokenDecimals = getTokenDecimals(
          captchaJobDto.chainId!,
          captchaJobDto.escrowFundToken,
        );

        const mockManifest = createMockHcaptchaManifest();
        mockManifestService.createManifest.mockResolvedValueOnce(mockManifest);
        const mockUrl = faker.internet.url();
        const mockHash = faker.string.uuid();
        mockManifestService.uploadManifest.mockResolvedValueOnce({
          url: mockUrl,
          hash: mockHash,
        });
        const jobEntityMock = createJobEntity();
        mockJobRepository.createUnique = jest
          .fn()
          .mockResolvedValueOnce(jobEntityMock);
        mockRateService.getRate
          .mockResolvedValueOnce(tokenToUsdRate)
          .mockResolvedValueOnce(usdToTokenRate);

        await jobService.createJob(
          userMock,
          HCaptchaJobType.HCAPTCHA,
          captchaJobDto,
        );

        expect(mockWeb3Service.validateChainId).toHaveBeenCalledWith(
          captchaJobDto.chainId,
        );
        expect(mockRoutingProtocolService.selectOracles).not.toHaveBeenCalled();
        expect(mockRoutingProtocolService.validateOracles).toHaveBeenCalledWith(
          captchaJobDto.chainId,
          HCaptchaJobType.HCAPTCHA,
          captchaJobDto.reputationOracle,
          captchaJobDto.exchangeOracle,
          captchaJobDto.recordingOracle,
        );
        expect(mockManifestService.createManifest).toHaveBeenCalledWith(
          captchaJobDto,
          HCaptchaJobType.HCAPTCHA,
          captchaJobDto.paymentAmount,
          fundTokenDecimals,
        );
        expect(mockManifestService.uploadManifest).toHaveBeenCalledWith(
          captchaJobDto.chainId,
          mockManifest,
          [
            captchaJobDto.exchangeOracle,
            captchaJobDto.reputationOracle,
            captchaJobDto.recordingOracle,
          ],
        );
        expect(mockPaymentService.createWithdrawalPayment).toHaveBeenCalledWith(
          userMock.id,
          expect.any(Number),
          captchaJobDto.paymentCurrency,
          tokenToUsdRate,
        );
        expect(mockJobRepository.updateOne).toHaveBeenCalledWith({
          chainId: captchaJobDto.chainId,
          userId: userMock.id,
          manifestUrl: mockUrl,
          manifestHash: mockHash,
          requestType: HCaptchaJobType.HCAPTCHA,
          fee: expect.any(Number),
          fundAmount: Number(
            mul(
              mul(captchaJobDto.paymentAmount, tokenToUsdRate),
              usdToTokenRate,
            ).toFixed(6),
          ),
          status: JobStatus.MODERATION_PASSED,
          waitUntil: expect.any(Date),
          token: captchaJobDto.escrowFundToken,
          exchangeOracle: captchaJobDto.exchangeOracle,
          recordingOracle: captchaJobDto.recordingOracle,
          reputationOracle: captchaJobDto.reputationOracle,
          payments: expect.any(Array),
        });
      });
    });

    describe('JobQuickLaunchDto', () => {
      it('should create a job with quick launch dto', async () => {
        const jobQuickLaunchDto = new JobQuickLaunchDto();
        jobQuickLaunchDto.chainId = 1;
        jobQuickLaunchDto.manifestUrl = faker.internet.url();
        jobQuickLaunchDto.manifestHash = faker.string.uuid();
        jobQuickLaunchDto.requestType = FortuneJobType.FORTUNE;
        jobQuickLaunchDto.paymentCurrency = PaymentCurrency.HMT;
        jobQuickLaunchDto.paymentAmount = faker.number.float({
          min: 1,
          max: 100,
          fractionDigits: 6,
        });
        jobQuickLaunchDto.escrowFundToken = EscrowFundToken.HMT;
        jobQuickLaunchDto.exchangeOracle = faker.finance.ethereumAddress();
        jobQuickLaunchDto.recordingOracle = faker.finance.ethereumAddress();
        jobQuickLaunchDto.reputationOracle = faker.finance.ethereumAddress();

        const jobEntityMock = createJobEntity();
        mockJobRepository.createUnique = jest
          .fn()
          .mockResolvedValueOnce(jobEntityMock);
        mockRateService.getRate
          .mockResolvedValueOnce(tokenToUsdRate)
          .mockResolvedValueOnce(usdToTokenRate);

        await jobService.createJob(
          userMock,
          FortuneJobType.FORTUNE,
          jobQuickLaunchDto,
        );

        expect(mockWeb3Service.validateChainId).toHaveBeenCalledWith(
          jobQuickLaunchDto.chainId,
        );
        expect(mockRoutingProtocolService.selectOracles).not.toHaveBeenCalled();
        expect(mockRoutingProtocolService.validateOracles).toHaveBeenCalledWith(
          jobQuickLaunchDto.chainId,
          FortuneJobType.FORTUNE,
          jobQuickLaunchDto.reputationOracle,
          jobQuickLaunchDto.exchangeOracle,
          jobQuickLaunchDto.recordingOracle,
        );
        expect(mockManifestService.createManifest).not.toHaveBeenCalled();
        expect(mockManifestService.uploadManifest).not.toHaveBeenCalled();
        expect(mockPaymentService.createWithdrawalPayment).toHaveBeenCalledWith(
          userMock.id,
          expect.any(Number),
          jobQuickLaunchDto.paymentCurrency,
          tokenToUsdRate,
        );
        expect(mockJobRepository.updateOne).toHaveBeenCalledWith({
          chainId: jobQuickLaunchDto.chainId,
          userId: userMock.id,
          manifestUrl: jobQuickLaunchDto.manifestUrl,
          manifestHash: jobQuickLaunchDto.manifestHash,
          requestType: FortuneJobType.FORTUNE,
          fee: expect.any(Number),
          fundAmount: Number(
            mul(
              mul(jobQuickLaunchDto.paymentAmount, tokenToUsdRate),
              usdToTokenRate,
            ).toFixed(6),
          ),
          status: JobStatus.MODERATION_PASSED,
          waitUntil: expect.any(Date),
          token: jobQuickLaunchDto.escrowFundToken,
          exchangeOracle: jobQuickLaunchDto.exchangeOracle,
          recordingOracle: jobQuickLaunchDto.recordingOracle,
          reputationOracle: jobQuickLaunchDto.reputationOracle,
          payments: expect.any(Array),
        });
      });
    });
  });

  describe('createEscrow', () => {
    it('should create an escrow and update job entity', async () => {
      const jobEntity = createJobEntity({
        status: JobStatus.MODERATION_PASSED,
        token: EscrowFundToken.HMT,
        escrowAddress: null,
      });

      const escrowAddress = faker.finance.ethereumAddress();
      mockedEscrowClient.build.mockResolvedValueOnce({
        createEscrow: jest.fn().mockResolvedValueOnce(escrowAddress),
      } as unknown as EscrowClient);

      mockWeb3Service.calculateGasPrice.mockResolvedValueOnce(1n);

      const result = await jobService.createEscrow(jobEntity);

      expect(mockWeb3Service.getSigner).toHaveBeenCalledWith(jobEntity.chainId);
      expect(mockWeb3Service.calculateGasPrice).toHaveBeenCalledWith(
        jobEntity.chainId,
      );
      expect(result.status).toBe(JobStatus.CREATED);
      expect(result.escrowAddress).toBe(escrowAddress);
      expect(mockJobRepository.updateOne).toHaveBeenCalledWith({
        ...jobEntity,
        status: JobStatus.CREATED,
        escrowAddress,
      });
    });

    it('should throw if escrow address is not returned', async () => {
      const jobEntity = createJobEntity({
        status: JobStatus.MODERATION_PASSED,
        token: EscrowFundToken.HMT,
        escrowAddress: null,
      });

      mockedEscrowClient.build.mockResolvedValueOnce({
        createEscrow: jest.fn().mockResolvedValueOnce(undefined),
      } as unknown as EscrowClient);

      mockWeb3Service.calculateGasPrice.mockResolvedValueOnce(1n);

      await expect(jobService.createEscrow(jobEntity)).rejects.toThrow(
        new ConflictError(ErrorEscrow.NotCreated),
      );
    });
  });

  describe('setupEscrow', () => {
    it('should setup escrow and update job status', async () => {
      const jobEntity = createJobEntity({
        status: JobStatus.FUNDED,
      });

      const escrowClientMock = {
        setup: jest.fn().mockResolvedValueOnce(undefined),
      };
      mockedEscrowClient.build.mockResolvedValueOnce(
        escrowClientMock as unknown as EscrowClient,
      );

      mockWeb3Service.calculateGasPrice.mockResolvedValueOnce(1n);
      mockedKVStoreUtils.get.mockImplementation(async (_chainId, address) => {
        switch (address) {
          case jobEntity.reputationOracle:
            return '1';
          case jobEntity.recordingOracle:
            return '2';
          case jobEntity.exchangeOracle:
            return '3';
          default:
            return '';
        }
      });

      const result = await jobService.setupEscrow(jobEntity);

      expect(mockWeb3Service.getSigner).toHaveBeenCalledWith(jobEntity.chainId);
      expect(mockWeb3Service.calculateGasPrice).toHaveBeenCalledWith(
        jobEntity.chainId,
      );
      expect(escrowClientMock.setup).toHaveBeenCalledWith(
        jobEntity.escrowAddress,
        {
          reputationOracle: jobEntity.reputationOracle,
          reputationOracleFee: 1n,
          recordingOracle: jobEntity.recordingOracle,
          recordingOracleFee: 2n,
          exchangeOracle: jobEntity.exchangeOracle,
          exchangeOracleFee: 3n,
          manifestUrl: jobEntity.manifestUrl,
          manifestHash: jobEntity.manifestHash,
        },
        { gasPrice: 1n },
      );
      expect(mockJobRepository.updateOne).toHaveBeenCalledWith({
        ...jobEntity,
        status: JobStatus.LAUNCHED,
      });
      expect(result.status).toBe(JobStatus.LAUNCHED);
      expect(mockWebhookRepository.createUnique).toHaveBeenCalledWith({
        escrowAddress: jobEntity.escrowAddress,
        chainId: jobEntity.chainId,
        eventType: EventType.ESCROW_CREATED,
        oracleType: jobEntity.requestType,
        oracleAddress: jobEntity.exchangeOracle,
        hasSignature: true,
        status: WebhookStatus.PENDING,
        retriesCount: 0,
        waitUntil: expect.any(Date),
      });
    });

    it('should throw if escrowClient setup fails', async () => {
      const jobEntity = createJobEntity({
        status: JobStatus.FUNDED,
      });

      const signer = createSignerMock() as unknown as Wallet;
      mockWeb3Service.getSigner.mockReturnValueOnce(signer);

      const escrowClientMock = {
        setup: jest.fn().mockRejectedValueOnce(new Error('Network error')),
      };
      mockedEscrowClient.build.mockResolvedValueOnce(
        escrowClientMock as unknown as EscrowClient,
      );

      mockWeb3Service.calculateGasPrice.mockResolvedValueOnce(1n);
      mockedKVStoreUtils.get.mockResolvedValueOnce('1');

      await expect(jobService.setupEscrow(jobEntity)).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('fundEscrow', () => {
    it('should fund escrow with the correct amount and update status', async () => {
      const jobEntityMock = createJobEntity({
        status: JobStatus.PAID,
        token: EscrowFundToken.HMT,
      });
      mockedKVStoreUtils.get.mockResolvedValueOnce('1');
      mockedEscrowClient.build.mockResolvedValueOnce({
        fund: jest.fn().mockResolvedValueOnce(undefined),
      } as unknown as EscrowClient);

      mockWeb3Service.calculateGasPrice.mockResolvedValueOnce(1n);

      await jobService.fundEscrow(jobEntityMock);

      expect(mockWeb3Service.getSigner).toHaveBeenCalledWith(
        jobEntityMock.chainId,
      );
      expect(mockWeb3Service.calculateGasPrice).toHaveBeenCalledWith(
        jobEntityMock.chainId,
      );
      expect(mockJobRepository.updateOne).toHaveBeenCalledWith({
        ...jobEntityMock,
        status: JobStatus.FUNDED,
      });
    });

    it('should throw if escrowClient fund fails', async () => {
      const jobEntityMock = createJobEntity({
        status: JobStatus.PAID,
        token: EscrowFundToken.HMT,
      });

      mockWeb3Service.getSigner.mockReturnValueOnce(
        createSignerMock() as unknown as Wallet,
      );
      mockedEscrowClient.build.mockResolvedValueOnce({
        fund: jest.fn().mockRejectedValueOnce(new Error('Network error')),
      } as unknown as EscrowClient);

      mockWeb3Service.calculateGasPrice.mockResolvedValueOnce(1n);

      await expect(jobService.fundEscrow(jobEntityMock)).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('requestToCancelJobById', () => {
    it('should request to cancel job by id', async () => {
      const jobEntityMock = createJobEntity({ status: JobStatus.LAUNCHED });
      mockJobRepository.findOneByIdAndUserId.mockResolvedValueOnce(
        jobEntityMock,
      );
      await expect(
        jobService.requestToCancelJobById(
          jobEntityMock.userId,
          jobEntityMock.id,
        ),
      ).resolves.toBeUndefined();
      expect(mockJobRepository.updateOne).toHaveBeenCalledWith({
        ...jobEntityMock,
        status: JobStatus.TO_CANCEL,
        retriesCount: 0,
      });
    });
    it('should throw an error if job not found', async () => {
      mockJobRepository.findOneByIdAndUserId.mockResolvedValueOnce(null);
      await expect(
        jobService.requestToCancelJobById(
          faker.number.int(),
          faker.number.int(),
        ),
      ).rejects.toThrow(new NotFoundError(ErrorJob.NotFound));
    });
    it('should throw an error if job status is invalid', async () => {
      const jobEntityMock = createJobEntity({ status: JobStatus.COMPLETED });
      mockJobRepository.findOneByIdAndUserId.mockResolvedValueOnce(
        jobEntityMock,
      );
      await expect(
        jobService.requestToCancelJobById(
          jobEntityMock.userId,
          jobEntityMock.id,
        ),
      ).rejects.toThrow(
        new ValidationError(ErrorJob.InvalidStatusCancellation),
      );
    });
  });

  describe('requestToCancelJobByAddress', () => {
    it('should request to cancel job by address', async () => {
      const jobEntityMock = createJobEntity({ status: JobStatus.LAUNCHED });
      mockJobRepository.findOneByChainIdAndEscrowAddress.mockResolvedValueOnce(
        jobEntityMock,
      );
      await expect(
        jobService.requestToCancelJobByAddress(
          jobEntityMock.userId,
          ChainId.POLYGON_AMOY,
          jobEntityMock.escrowAddress!,
        ),
      ).resolves.toBeUndefined();
      expect(mockWeb3Service.validateChainId).toHaveBeenCalledWith(
        ChainId.POLYGON_AMOY,
      );
      expect(mockJobRepository.updateOne).toHaveBeenCalledWith({
        ...jobEntityMock,
        status: JobStatus.TO_CANCEL,
        retriesCount: 0,
      });
    });
    it('should throw an error if job not found', async () => {
      mockJobRepository.findOneByChainIdAndEscrowAddress.mockResolvedValueOnce(
        null,
      );
      await expect(
        jobService.requestToCancelJobByAddress(
          faker.number.int(),
          faker.number.int(),
          faker.finance.ethereumAddress(),
        ),
      ).rejects.toThrow(new NotFoundError(ErrorJob.NotFound));
    });
    it('should throw an error if job status is invalid', async () => {
      const jobEntityMock = createJobEntity({ status: JobStatus.COMPLETED });
      mockJobRepository.findOneByChainIdAndEscrowAddress.mockResolvedValueOnce(
        jobEntityMock,
      );
      await expect(
        jobService.requestToCancelJobByAddress(
          jobEntityMock.userId,
          ChainId.POLYGON_AMOY,
          jobEntityMock.escrowAddress!,
        ),
      ).rejects.toThrow(
        new ValidationError(ErrorJob.InvalidStatusCancellation),
      );
      expect(mockWeb3Service.validateChainId).toHaveBeenCalledWith(
        ChainId.POLYGON_AMOY,
      );
    });
  });

  describe('getJobsByStatus', () => {
    it('should return jobs by status', async () => {
      const jobStatus = JobStatus.LAUNCHED;
      const jobEntityMock = createJobEntity({ status: jobStatus });
      const getJobsDto: GetJobsDto = {
        status: JobStatusFilter.LAUNCHED,
        page: 1,
        pageSize: 10,
        skip: 10,
      };
      mockJobRepository.fetchFiltered.mockResolvedValueOnce({
        entities: [jobEntityMock],
        itemCount: 1,
      });
      const result = await jobService.getJobsByStatus(
        getJobsDto,
        jobEntityMock.userId,
      );
      expect(mockWeb3Service.validateChainId).not.toHaveBeenCalled();
      expect(mockJobRepository.fetchFiltered).toHaveBeenCalledWith(
        getJobsDto,
        jobEntityMock.userId,
      );
      expect(result).toEqual({
        page: getJobsDto.page,
        pageSize: getJobsDto.pageSize,
        totalPages: 1,
        totalResults: 1,
        results: [
          {
            jobId: jobEntityMock.id,
            escrowAddress: jobEntityMock.escrowAddress,
            network: NETWORKS[jobEntityMock.chainId as ChainId]!.title,
            fundAmount: jobEntityMock.fundAmount,
            currency: jobEntityMock.token,
            status: jobStatus,
          },
        ],
      });
    });

    it('should validate chainId if specified', async () => {
      const jobStatus = JobStatus.LAUNCHED;
      const jobEntityMock = createJobEntity({ status: jobStatus });
      const getJobsDto: GetJobsDto = {
        status: JobStatusFilter.LAUNCHED,
        chainId: [ChainId.POLYGON_AMOY],
        page: 1,
        pageSize: 10,
        skip: 10,
      };
      mockJobRepository.fetchFiltered.mockResolvedValueOnce({
        entities: [jobEntityMock],
        itemCount: 1,
      });
      const result = await jobService.getJobsByStatus(
        getJobsDto,
        jobEntityMock.userId,
      );
      expect(mockWeb3Service.validateChainId).toHaveBeenCalledWith(
        getJobsDto.chainId![0],
      );
      expect(mockJobRepository.fetchFiltered).toHaveBeenCalledWith(
        getJobsDto,
        jobEntityMock.userId,
      );
      expect(result).toEqual({
        page: getJobsDto.page,
        pageSize: getJobsDto.pageSize,
        totalPages: 1,
        totalResults: 1,
        results: [
          {
            jobId: jobEntityMock.id,
            escrowAddress: jobEntityMock.escrowAddress,
            network: NETWORKS[jobEntityMock.chainId as ChainId]!.title,
            fundAmount: jobEntityMock.fundAmount,
            currency: jobEntityMock.token,
            status: jobStatus,
          },
        ],
      });
    });
  });

  describe('getResult', () => {
    const userId = faker.number.int();
    const jobId = faker.number.int();
    const url = faker.internet.url();

    beforeEach(() => {
      (EscrowClient.build as any).mockImplementationOnce(() => ({
        getResultsUrl: jest.fn().mockResolvedValueOnce(url),
      }));
    });

    it('should download and return the fortune result', async () => {
      const jobEntityMock = createJobEntity();

      mockJobRepository.findOneByIdAndUserId.mockResolvedValueOnce(
        jobEntityMock,
      );

      const fortuneResult: FortuneFinalResultDto[] = [
        {
          workerAddress: faker.finance.ethereumAddress(),
          solution: 'good',
        },
        {
          workerAddress: faker.finance.ethereumAddress(),
          solution: 'bad',
          error: 'wrong answer',
        },
      ];

      mockStorageService.downloadJsonLikeData.mockResolvedValueOnce(
        fortuneResult,
      );

      const result = await jobService.getResult(userId, jobId);

      expect(mockStorageService.downloadJsonLikeData).toHaveBeenCalledWith(url);
      expect(mockStorageService.downloadJsonLikeData).toHaveBeenCalledTimes(1);
      expect(result).toEqual(fortuneResult);
    });

    it('should download and return the image binary result', async () => {
      const jobEntityMock = createJobEntity({
        requestType: CvatJobType.IMAGE_BOXES,
      });

      mockJobRepository.findOneByIdAndUserId.mockResolvedValueOnce(
        jobEntityMock,
      );

      const result = await jobService.getResult(userId, jobId);

      expect(result).toEqual(url);
    });

    it('should throw a NotFoundError if the result is not found', async () => {
      mockJobRepository.findOneByIdAndUserId.mockResolvedValueOnce(
        createJobEntity(),
      );

      mockStorageService.downloadJsonLikeData.mockResolvedValueOnce([]);

      await expect(jobService.getResult(userId, jobId)).rejects.toThrow(
        new NotFoundError(ErrorJob.ResultNotFound),
      );
      expect(mockStorageService.downloadJsonLikeData).toHaveBeenCalledWith(url);
      expect(mockStorageService.downloadJsonLikeData).toHaveBeenCalledTimes(1);
    });

    it('should throw a ValidationError if the result is not valid', async () => {
      mockJobRepository.findOneByIdAndUserId.mockResolvedValueOnce(
        createJobEntity(),
      );

      const fortuneResult: any[] = [
        {
          wrongAddress: faker.finance.ethereumAddress(),
          solution: 1,
        },
        {
          wrongAddress: faker.finance.ethereumAddress(),
          solution: 1,
          error: 1,
        },
      ];

      (EscrowClient.build as any).mockImplementation(() => ({
        getResultsUrl: jest.fn().mockResolvedValueOnce(url),
      }));
      mockStorageService.downloadJsonLikeData.mockResolvedValueOnce(
        fortuneResult,
      );

      await expect(jobService.getResult(userId, jobId)).rejects.toThrow(
        new ValidationError(ErrorJob.ResultValidationFailed),
      );

      expect(mockStorageService.downloadJsonLikeData).toHaveBeenCalledWith(url);
      expect(mockStorageService.downloadJsonLikeData).toHaveBeenCalledTimes(1);
    });
  });

  describe('downloadJobResults', () => {
    it('should download job results', async () => {
      mockJobRepository.findOneByIdAndUserId.mockResolvedValueOnce(
        createJobEntity({
          requestType: CvatJobType.IMAGE_BOXES,
        }),
      );
      const sampleFile = Buffer.from('test-file-contents');
      mockStorageService.downloadFile.mockResolvedValueOnce(sampleFile);
      const result = await jobService.downloadJobResults(
        faker.number.int(),
        faker.number.int(),
      );

      expect(result).toHaveProperty('filename');
      expect(result.contents).toEqual(sampleFile);
    });

    it('should throw an error if job not found', async () => {
      mockJobRepository.findOneByIdAndUserId.mockResolvedValueOnce(null);
      await expect(
        jobService.downloadJobResults(faker.number.int(), faker.number.int()),
      ).rejects.toThrow(new NotFoundError(ErrorJob.NotFound));
    });

    it('should throw an error if job type is invalid', async () => {
      mockJobRepository.findOneByIdAndUserId.mockResolvedValueOnce(
        createJobEntity({
          requestType: FortuneJobType.FORTUNE,
        }),
      );
      await expect(
        jobService.downloadJobResults(faker.number.int(), faker.number.int()),
      ).rejects.toThrow(new ValidationError(ErrorJob.InvalidRequestType));
    });
  });

  describe('handleProcessJobFailure', () => {
    beforeAll(() => {
      (mockServerConfigService as any).maxRetryCount = 5;
    });

    it('should increase job failure count', async () => {
      const jobEntity = createJobEntity({
        status: JobStatus.LAUNCHED,
        retriesCount: 0,
      });
      const reason = faker.lorem.sentence();
      await expect(
        jobService.handleProcessJobFailure(jobEntity, reason),
      ).resolves.toBeUndefined();
      expect(mockJobRepository.updateOne).toHaveBeenCalledWith({
        ...jobEntity,
        status: JobStatus.LAUNCHED,
        failedReason: null,
        retriesCount: 1,
      });
    });

    it('should handle job failure and update job status', async () => {
      const jobEntity = createJobEntity({
        status: JobStatus.LAUNCHED,
        retriesCount: 5,
      });
      const reason = faker.lorem.sentence();
      await expect(
        jobService.handleProcessJobFailure(jobEntity, reason),
      ).resolves.toBeUndefined();
      expect(mockJobRepository.updateOne).toHaveBeenCalledWith({
        ...jobEntity,
        status: JobStatus.FAILED,
        failedReason: reason,
        retriesCount: jobEntity.retriesCount,
      });
    });
  });

  describe('getOracleType', () => {
    it.each(Object.values(FortuneJobType))(
      'should return OracleType.FORTUNE for Fortune job type %s',
      (jobType) => {
        expect(jobService.getOracleType(jobType)).toBe(OracleType.FORTUNE);
      },
    );

    it.each(Object.values(CvatJobType))(
      'should return OracleType.CVAT for CVAT job type %s',
      (jobType) => {
        expect(jobService.getOracleType(jobType)).toBe(OracleType.CVAT);
      },
    );

    it.each(Object.values(AudinoJobType))(
      'should return OracleType.AUDINO for Audino job type %s',
      (jobType) => {
        expect(jobService.getOracleType(jobType)).toBe(OracleType.AUDINO);
      },
    );

    it.each(Object.values(HCaptchaJobType))(
      'should return OracleType.HCAPTCHA for HCaptcha job type %s',
      (jobType) => {
        expect(jobService.getOracleType(jobType)).toBe(OracleType.HCAPTCHA);
      },
    );
  });

  describe('processEscrowCancellation', () => {
    it('should process escrow cancellation', async () => {
      const jobEntity = createJobEntity();
      mockWeb3Service.calculateGasPrice.mockResolvedValueOnce(1n);
      const getStatusMock = jest.fn().mockResolvedValueOnce('Active');
      const getBalanceMock = jest.fn().mockResolvedValueOnce(100n);
      const cancelMock = jest
        .fn()
        .mockResolvedValueOnce({ txHash: '0x', amountRefunded: 100n });

      mockedEscrowClient.build.mockResolvedValueOnce({
        getStatus: getStatusMock,
        getBalance: getBalanceMock,
        cancel: cancelMock,
      } as unknown as EscrowClient);

      const result = await jobService.processEscrowCancellation(jobEntity);
      expect(result).toBe(undefined);
      expect(mockWeb3Service.getSigner).toHaveBeenCalledWith(jobEntity.chainId);

      expect(getStatusMock).toHaveBeenCalled();
      expect(getBalanceMock).toHaveBeenCalled();
      expect(cancelMock).toHaveBeenCalled();
    });

    it('should throw if escrow status is not Active', async () => {
      const jobEntity = createJobEntity();
      mockWeb3Service.calculateGasPrice.mockResolvedValueOnce(1n);
      mockedEscrowClient.build.mockResolvedValueOnce({
        getStatus: jest.fn().mockResolvedValueOnce(EscrowStatus.Complete),
        getBalance: jest.fn().mockResolvedValueOnce(100n),
        cancel: jest.fn(),
      } as unknown as EscrowClient);

      await expect(
        jobService.processEscrowCancellation(jobEntity),
      ).rejects.toThrow(
        new ConflictError(ErrorEscrow.InvalidStatusCancellation),
      );
    });

    it('should throw if escrow balance is zero', async () => {
      const jobEntity = createJobEntity();
      mockWeb3Service.calculateGasPrice.mockResolvedValueOnce(1n);
      mockedEscrowClient.build.mockResolvedValueOnce({
        getStatus: jest.fn().mockResolvedValueOnce(EscrowStatus.Pending),
        getBalance: jest.fn().mockResolvedValueOnce(0n),
        cancel: jest.fn(),
      } as unknown as EscrowClient);

      await expect(
        jobService.processEscrowCancellation(jobEntity),
      ).rejects.toThrow(
        new ConflictError(ErrorEscrow.InvalidBalanceCancellation),
      );
    });

    it('should throw if cancel throws an error', async () => {
      const jobEntity = createJobEntity();
      mockWeb3Service.calculateGasPrice.mockResolvedValueOnce(1n);
      mockedEscrowClient.build.mockResolvedValueOnce({
        getStatus: jest.fn().mockResolvedValueOnce(EscrowStatus.Pending),
        getBalance: jest.fn().mockResolvedValueOnce(100n),
        cancel: jest.fn().mockRejectedValueOnce(new Error('Network error')),
      } as unknown as EscrowClient);

      await expect(
        jobService.processEscrowCancellation(jobEntity),
      ).rejects.toThrow('Network error');
    });
  });

  describe('escrowFailedWebhook', () => {
    it('should handle escrow failed webhook', async () => {
      const jobEntity = createJobEntity({ status: JobStatus.LAUNCHED });
      mockJobRepository.findOneByChainIdAndEscrowAddress.mockResolvedValueOnce(
        jobEntity,
      );
      const reason = faker.lorem.sentence();
      await expect(
        jobService.escrowFailedWebhook({
          eventType: EventType.ESCROW_FAILED,
          chainId: 1,
          escrowAddress: '0x',
          eventData: { reason: reason },
        }),
      ).resolves.toBeUndefined();
      expect(mockJobRepository.updateOne).toHaveBeenCalledWith({
        ...jobEntity,
        status: JobStatus.FAILED,
        failedReason: reason,
      });
    });

    it('should throw an error if job not found', async () => {
      mockJobRepository.findOneByChainIdAndEscrowAddress.mockResolvedValueOnce(
        null,
      );
      await expect(
        jobService.escrowFailedWebhook({
          eventType: EventType.ESCROW_FAILED,
          chainId: 1,
          escrowAddress: '0x',
          eventData: { reason: faker.lorem.sentence() },
        }),
      ).rejects.toThrow(new NotFoundError(ErrorJob.NotFound));
    });

    it('should throw an error if job is not in LAUNCHED status', async () => {
      const jobEntity = createJobEntity({ status: JobStatus.COMPLETED });
      mockJobRepository.findOneByChainIdAndEscrowAddress.mockResolvedValueOnce(
        jobEntity,
      );
      await expect(
        jobService.escrowFailedWebhook({
          eventType: EventType.ESCROW_FAILED,
          chainId: 1,
          escrowAddress: '0x',
          eventData: { reason: faker.lorem.sentence() },
        }),
      ).rejects.toThrow(new ValidationError(ErrorJob.NotLaunched));
    });

    it('should throw an error if event data is missing', async () => {
      const jobEntity = createJobEntity({ status: JobStatus.LAUNCHED });
      mockJobRepository.findOneByChainIdAndEscrowAddress.mockResolvedValueOnce(
        jobEntity,
      );
      await expect(
        jobService.escrowFailedWebhook({
          eventType: EventType.ESCROW_FAILED,
          chainId: 1,
          escrowAddress: '0x',
        }),
      ).rejects.toThrow(
        new ValidationError('Event data is required but was not provided.'),
      );
    });

    it('should throw an error if event data is missing reason', async () => {
      const jobEntity = createJobEntity({ status: JobStatus.LAUNCHED });
      mockJobRepository.findOneByChainIdAndEscrowAddress.mockResolvedValueOnce(
        jobEntity,
      );
      await expect(
        jobService.escrowFailedWebhook({
          eventType: EventType.ESCROW_FAILED,
          chainId: 1,
          escrowAddress: '0x',
          eventData: {},
        }),
      ).rejects.toThrow(
        new ValidationError('Reason is undefined in event data.'),
      );
    });
  });

  describe('getDetails', () => {
    it('should return job details with escrow address successfully', async () => {
      const jobEntity = createJobEntity();

      const fundTokenDecimals = getTokenDecimals(
        jobEntity.chainId,
        jobEntity.token as EscrowFundToken,
      );

      const manifestMock = createMockFortuneManifest({
        fundAmount: jobEntity.fundAmount,
      });

      const getEscrowData = {
        token: faker.finance.ethereumAddress(),
        totalFundedAmount: ethers.parseUnits(
          jobEntity.fundAmount.toString(),
          fundTokenDecimals,
        ),
        balance: 0,
        amountPaid: 0,
        exchangeOracle: jobEntity.exchangeOracle,
        recordingOracle: jobEntity.recordingOracle,
        reputationOracle: jobEntity.reputationOracle,
      } as unknown as IEscrow;

      mockJobRepository.findOneByIdAndUserId.mockResolvedValueOnce(jobEntity);
      mockedEscrowUtils.getEscrow.mockResolvedValueOnce(getEscrowData);
      mockManifestService.downloadManifest.mockResolvedValueOnce(manifestMock);
      const signer = createSignerMock() as unknown as Wallet;
      mockWeb3Service.getSigner.mockReturnValueOnce(signer);

      const result = await jobService.getDetails(
        faker.number.int(),
        faker.number.int(),
      );

      expect(result).toStrictEqual({
        details: {
          escrowAddress: jobEntity.escrowAddress,
          manifestUrl: jobEntity.manifestUrl,
          manifestHash: jobEntity.manifestHash,
          status: jobEntity.status,
          failedReason: jobEntity.failedReason,
          balance: getEscrowData.balance,
          paidOut: getEscrowData.amountPaid,
          currency: jobEntity.token,
        },
        manifest: {
          title: manifestMock.requesterTitle,
          description: manifestMock.requesterDescription,
          submissionsRequired: manifestMock.submissionsRequired,
          fundAmount: jobEntity.fundAmount,
          requestType: manifestMock.requestType,
          chainId: jobEntity.chainId,
          exchangeOracleAddress: jobEntity.exchangeOracle,
          recordingOracleAddress: jobEntity.recordingOracle,
          reputationOracleAddress: jobEntity.reputationOracle,
          requesterAddress: signer.address,
          tokenAddress: getEscrowData.token,
        },
      });
    });

    it('should return job details without escrow address successfully', async () => {
      const jobEntity = createJobEntity({ escrowAddress: null });

      const manifestMock = createMockFortuneManifest({
        fundAmount: jobEntity.fundAmount,
      });

      mockJobRepository.findOneByIdAndUserId.mockResolvedValueOnce(jobEntity);
      mockManifestService.downloadManifest.mockResolvedValueOnce(manifestMock);
      const signer = createSignerMock() as unknown as Wallet;
      mockWeb3Service.getSigner.mockReturnValueOnce(signer);

      const result = await jobService.getDetails(
        faker.number.int(),
        faker.number.int(),
      );
      expect(mockedEscrowUtils.getEscrow).not.toHaveBeenCalled();
      expect(result).toStrictEqual({
        details: {
          escrowAddress: ZeroAddress,
          manifestUrl: jobEntity.manifestUrl,
          manifestHash: jobEntity.manifestHash,
          status: jobEntity.status,
          failedReason: jobEntity.failedReason,
          balance: 0,
          paidOut: 0,
        },
        manifest: {
          title: manifestMock.requesterTitle,
          description: manifestMock.requesterDescription,
          submissionsRequired: manifestMock.submissionsRequired,
          fundAmount: 0,
          requestType: manifestMock.requestType,
          chainId: jobEntity.chainId,
          exchangeOracleAddress: ZeroAddress,
          recordingOracleAddress: ZeroAddress,
          reputationOracleAddress: ZeroAddress,
          requesterAddress: signer.address,
          tokenAddress: ZeroAddress,
        },
      });
    });

    it('should throw not found exception when job not found', async () => {
      mockJobRepository.findOneByIdAndUserId.mockResolvedValueOnce(null);

      await expect(
        jobService.getDetails(faker.number.int(), faker.number.int()),
      ).rejects.toThrow(new NotFoundError(ErrorJob.NotFound));
    });
  });

  describe('finalizeJob', () => {
    it('should complete a job', async () => {
      const jobEntity = createJobEntity({
        status: JobStatus.LAUNCHED,
      });
      mockJobRepository.findOneByChainIdAndEscrowAddress.mockResolvedValueOnce(
        jobEntity,
      );
      await expect(
        jobService.finalizeJob({
          chainId: ChainId.POLYGON_AMOY,
          escrowAddress: faker.finance.ethereumAddress(),
          eventType: EventType.ESCROW_COMPLETED,
        }),
      ).resolves.toBeUndefined();
      expect(mockJobRepository.updateOne).toHaveBeenCalledWith({
        ...jobEntity,
        status: JobStatus.COMPLETED,
      });
    });

    it('should do nothing if job is already COMPLETED', async () => {
      const jobEntity = createJobEntity({ status: JobStatus.COMPLETED });
      mockJobRepository.findOneByChainIdAndEscrowAddress.mockResolvedValueOnce(
        jobEntity,
      );
      await expect(
        jobService.finalizeJob({
          chainId: ChainId.POLYGON_AMOY,
          escrowAddress: faker.finance.ethereumAddress(),
          eventType: EventType.ESCROW_COMPLETED,
        }),
      ).resolves.toBeUndefined();
      expect(mockJobRepository.updateOne).not.toHaveBeenCalled();
    });

    it('should do nothing if job is already CANCELED', async () => {
      const jobEntity = createJobEntity({ status: JobStatus.CANCELED });
      mockJobRepository.findOneByChainIdAndEscrowAddress.mockResolvedValueOnce(
        jobEntity,
      );
      await expect(
        jobService.finalizeJob({
          chainId: ChainId.POLYGON_AMOY,
          escrowAddress: faker.finance.ethereumAddress(),
          eventType: EventType.ESCROW_COMPLETED,
        }),
      ).resolves.toBeUndefined();
      expect(mockJobRepository.updateOne).not.toHaveBeenCalled();
    });

    it('should call cancelJob if eventType is ESCROW_CANCELED and status is LAUNCHED', async () => {
      const jobEntity = createJobEntity({ status: JobStatus.LAUNCHED });
      mockJobRepository.findOneByChainIdAndEscrowAddress.mockResolvedValueOnce(
        jobEntity,
      );
      const cancelJobSpy = jest
        .spyOn(jobService, 'cancelJob')
        .mockResolvedValueOnce();
      await jobService.finalizeJob({
        chainId: ChainId.POLYGON_AMOY,
        escrowAddress: faker.finance.ethereumAddress(),
        eventType: EventType.ESCROW_CANCELED,
      });
      expect(cancelJobSpy).toHaveBeenCalledWith(jobEntity);
    });

    it('should throw ConflictError if eventType is not ESCROW_COMPLETED or ESCROW_CANCELED', async () => {
      const jobEntity = createJobEntity({ status: JobStatus.LAUNCHED });
      mockJobRepository.findOneByChainIdAndEscrowAddress.mockResolvedValueOnce(
        jobEntity,
      );
      await expect(
        jobService.finalizeJob({
          chainId: ChainId.POLYGON_AMOY,
          escrowAddress: faker.finance.ethereumAddress(),
          eventType: EventType.ESCROW_FAILED,
        }),
      ).rejects.toThrow(new ConflictError(ErrorJob.InvalidStatusCompletion));
    });
  });

  describe('isEscrowFunded', () => {
    it('should check if escrow is funded', async () => {
      mockedEscrowClient.build.mockResolvedValueOnce({
        getBalance: jest
          .fn()
          .mockResolvedValueOnce(
            BigInt(faker.number.int({ min: 1, max: 1000 })),
          ),
      } as unknown as EscrowClient);
      const result = await jobService.isEscrowFunded(
        faker.number.int(),
        faker.finance.ethereumAddress(),
      );
      expect(result).toBe(true);
    });

    it('should return false if escrow was not funded', async () => {
      mockedEscrowClient.build.mockResolvedValueOnce({
        getBalance: jest.fn().mockResolvedValueOnce(0n),
      } as unknown as EscrowClient);
      const result = await jobService.isEscrowFunded(
        faker.number.int(),
        faker.finance.ethereumAddress(),
      );
      expect(result).toBe(false);
    });

    it('should return false if escrowAddress is not provided', async () => {
      const result = await jobService.isEscrowFunded(faker.number.int(), '');
      expect(result).toBe(false);
    });
  });

  describe('cancelJob', () => {
    it('should create a refund payment and set status to CANCELED', async () => {
      const jobEntity = createJobEntity();
      const refundAmount = faker.number.float({ min: 1, max: 10 });

      mockPaymentService.getJobPayments.mockResolvedValueOnce([]);
      mockedEscrowUtils.getCancellationRefund.mockResolvedValueOnce({
        amount: ethers.parseUnits(refundAmount.toString(), 18),
        escrowAddress: jobEntity.escrowAddress!,
      } as any);
      mockPaymentService.createRefundPayment.mockResolvedValueOnce(undefined);
      mockJobRepository.updateOne.mockResolvedValueOnce(jobEntity);

      await jobService.cancelJob(jobEntity);

      expect(mockPaymentService.getJobPayments).toHaveBeenCalledWith(
        jobEntity.id,
        PaymentType.SLASH,
      );
      expect(EscrowUtils.getCancellationRefund).toHaveBeenCalledWith(
        jobEntity.chainId,
        jobEntity.escrowAddress,
      );
      expect(mockPaymentService.createRefundPayment).toHaveBeenCalledWith({
        refundAmount: refundAmount,
        refundCurrency: jobEntity.token,
        userId: jobEntity.userId,
        jobId: jobEntity.id,
      });
      expect(jobEntity.status).toBe(JobStatus.CANCELED);
      expect(mockJobRepository.updateOne).toHaveBeenCalledWith(jobEntity);
    });

    it('should NOT create a refund if SLASH payment exists, but still set status to CANCELED', async () => {
      const jobEntity = createJobEntity();
      mockPaymentService.getJobPayments.mockResolvedValueOnce([
        {
          id: faker.number.int(),
          jobId: jobEntity.id,
          type: PaymentType.SLASH,
          amount: 10,
          status: 'SUCCEEDED',
          createdAt: new Date(),
        } as any,
      ]);
      await jobService.cancelJob(jobEntity);

      expect(mockPaymentService.getJobPayments).toHaveBeenCalledWith(
        jobEntity.id,
        PaymentType.SLASH,
      );
      expect(EscrowUtils.getCancellationRefund).not.toHaveBeenCalled();
      expect(mockPaymentService.createRefundPayment).not.toHaveBeenCalled();
      expect(jobEntity.status).toBe(JobStatus.CANCELED);
      expect(mockJobRepository.updateOne).toHaveBeenCalledWith(jobEntity);
    });

    it('should throw ConflictError if no refund is found', async () => {
      const jobEntity = createJobEntity();
      mockPaymentService.getJobPayments.mockResolvedValueOnce([]);
      mockedEscrowUtils.getCancellationRefund.mockResolvedValueOnce(
        null as any,
      );

      await expect(jobService.cancelJob(jobEntity)).rejects.toThrow(
        new ConflictError(ErrorJob.NoRefundFound),
      );
    });

    it('should throw ConflictError if refund.amount is empty', async () => {
      const jobEntity = createJobEntity();
      mockPaymentService.getJobPayments.mockResolvedValueOnce([]);
      mockedEscrowUtils.getCancellationRefund.mockResolvedValueOnce({
        amount: 0,
        escrowAddress: jobEntity.escrowAddress!,
      } as any);

      await expect(jobService.cancelJob(jobEntity)).rejects.toThrow(
        new ConflictError(ErrorJob.NoRefundFound),
      );
    });
  });
});
