import { createMock } from '@golevelup/ts-jest';
import { ChainId, EscrowClient, StorageClient } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { BigNumber, FixedNumber, ethers } from 'ethers';
import { ErrorBucket, ErrorJob } from '../../common/constants/errors';
import {
  Currency,
  PaymentSource,
  PaymentType,
  TokenId,
} from '../../common/enums/payment';
import { JobRequestType, JobStatus } from '../../common/enums/job';
import {
  MOCK_ADDRESS,
  MOCK_BUCKET_NAME,
  MOCK_CHAIN_ID,
  MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
  MOCK_FILE_HASH,
  MOCK_FILE_KEY,
  MOCK_FILE_URL,
  MOCK_FORTUNES_REQUIRED,
  MOCK_JOB_LAUNCHER_FEE,
  MOCK_PRIVATE_KEY,
  MOCK_RECORDING_ORACLE_ADDRESS,
  MOCK_RECORDING_ORACLE_FEE,
  MOCK_REPUTATION_ORACLE_ADDRESS,
  MOCK_REPUTATION_ORACLE_FEE,
  MOCK_REQUESTER_DESCRIPTION,
  MOCK_REQUESTER_TITLE,
} from '../../../test/constants';
import { PaymentService } from '../payment/payment.service';
import { Web3Service } from '../web3/web3.service';
import {
  FortuneManifestDto,
  ImageLabelBinaryManifestDto,
  JobFortuneDto,
} from './job.dto';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';
import { JobService } from './job.service';

import { HMToken__factory } from '@human-protocol/core/typechain-types';
import { CurrencyService } from '../payment/currency.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn().mockImplementation(() => ({
      createAndSetupEscrow: jest.fn().mockResolvedValue(MOCK_ADDRESS),
    })),
  },
  StorageClient: jest.fn().mockImplementation(() => ({
    uploadFiles: jest
      .fn()
      .mockResolvedValue([
        { key: MOCK_FILE_KEY, url: MOCK_FILE_URL, hash: MOCK_FILE_HASH },
      ]),
  })),
}));

describe('JobService', () => {
  let jobService: JobService;
  let jobRepository: JobRepository;
  let paymentService: PaymentService;
  let currencyService: CurrencyService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeEach(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'JOB_LAUNCHER_FEE':
            return MOCK_JOB_LAUNCHER_FEE;
          case 'RECORDING_ORACLE_FEE':
            return MOCK_RECORDING_ORACLE_FEE;
          case 'REPUTATION_ORACLE_FEE':
            return MOCK_REPUTATION_ORACLE_FEE;
          case 'WEB3_JOB_LAUNCHER_PRIVATE_KEY':
            return MOCK_PRIVATE_KEY;
          case 'RECORDING_ORACLE_ADDRESS':
            return MOCK_RECORDING_ORACLE_ADDRESS;
          case 'REPUTATION_ORACLE_ADDRESS':
            return MOCK_REPUTATION_ORACLE_ADDRESS;
          case 'EXCHANGE_ORACLE_WEBHOOK_URL':
            return MOCK_EXCHANGE_ORACLE_WEBHOOK_URL;
          case 'HOST':
            return '127.0.0.1';
          case 'PORT':
            return 5000;
          case 'WEB3_PRIVATE_KEY':
            return '5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        JobService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        { provide: CurrencyService, useValue: createMock<CurrencyService>() },
        { provide: JobRepository, useValue: createMock<JobRepository>() },
        { provide: PaymentService, useValue: createMock<PaymentService>() },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    currencyService = moduleRef.get(CurrencyService);
    jobService = moduleRef.get<JobService>(JobService);
    jobRepository = moduleRef.get(JobRepository);
    paymentService = moduleRef.get(PaymentService);
  });

  describe('createFortuneJob', () => {
    const rate = 0.5;
    const userId = 1;
    const dto: JobFortuneDto = {
      chainId: MOCK_CHAIN_ID,
      fortunesRequired: MOCK_FORTUNES_REQUIRED,
      requesterTitle: MOCK_REQUESTER_TITLE,
      requesterDescription: MOCK_REQUESTER_DESCRIPTION,
      fundAmount: 10,
    };

    let getUserBalanceMock: any;

    beforeEach(() => {
      getUserBalanceMock = jest.spyOn(paymentService, 'getUserBalance');

      jest.spyOn(currencyService, 'getRate').mockResolvedValue(rate);
      jest.spyOn(paymentService, 'savePayment').mockResolvedValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create a fortune job successfully', async () => {
      const userBalance = ethers.utils.parseUnits('15', 'ether');
      getUserBalanceMock.mockResolvedValue(userBalance);

      const fundAmountInWei = ethers.utils.parseUnits(
        dto.fundAmount.toString(),
        'ether',
      );
      const jobLauncherFee = BigNumber.from(MOCK_JOB_LAUNCHER_FEE)
        .div(100)
        .mul(fundAmountInWei);

      const usdTotalAmount = BigNumber.from(
        FixedNumber.from(
          ethers.utils.formatUnits(
            fundAmountInWei.add(jobLauncherFee),
            'ether',
          ),
        ).mulUnsafe(FixedNumber.from(rate.toString())),
      );

      await jobService.createFortuneJob(userId, dto);

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
      expect(paymentService.savePayment).toHaveBeenCalledWith(
        userId,
        PaymentSource.BALANCE,
        Currency.USD,
        TokenId.HMT,
        PaymentType.WITHDRAWAL,
        usdTotalAmount,
      );
      expect(jobRepository.create).toHaveBeenCalledWith({
        chainId: dto.chainId,
        userId,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        fee: jobLauncherFee.toString(),
        fundAmount: fundAmountInWei.toString(),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
      });
    });

    it('should throw an exception for insufficient user balance', async () => {
      const fundAmount = 10; // ETH
      const userBalance = ethers.utils.parseUnits('1', 'ether'); // 1 ETH

      jest
        .spyOn(paymentService, 'getUserBalance')
        .mockResolvedValue(userBalance);

      getUserBalanceMock.mockResolvedValue(userBalance);

      const dto: JobFortuneDto = {
        chainId: MOCK_CHAIN_ID,
        fortunesRequired: MOCK_FORTUNES_REQUIRED,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount,
      };

      await expect(
        jobService.createFortuneJob(userId, dto),
      ).rejects.toThrowError(ErrorJob.NotEnoughFunds);
    });

    it('should throw an exception if job entity creation fails', async () => {
      const fundAmount = 1; // ETH

      const userBalance = ethers.utils.parseUnits('10', 'ether');

      getUserBalanceMock.mockResolvedValue(userBalance);

      jest.spyOn(jobRepository, 'create').mockResolvedValue(undefined!);

      const dto: JobFortuneDto = {
        chainId: MOCK_CHAIN_ID,
        fortunesRequired: MOCK_FORTUNES_REQUIRED,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount,
      };

      await expect(
        jobService.createFortuneJob(userId, dto),
      ).rejects.toThrowError(ErrorJob.NotCreated);
    });
  });

  describe('launchJob with Fortune type', () => {
    let getManifestMock: any;
    const chainId = ChainId.LOCALHOST;

    const mockTokenContract: any = {
      transfer: jest.fn(),
    };

    beforeEach(() => {
      jest
        .spyOn(HMToken__factory, 'connect')
        .mockReturnValue(mockTokenContract);
      getManifestMock = jest.spyOn(jobService, 'getManifest');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should launch a job successfully', async () => {
      const fundAmountInWei = ethers.utils.parseUnits('10', 'ether');
      const totalFeePercentage = BigNumber.from(MOCK_JOB_LAUNCHER_FEE)
        .add(MOCK_RECORDING_ORACLE_FEE)
        .add(MOCK_REPUTATION_ORACLE_FEE);
      const totalFee = BigNumber.from(fundAmountInWei)
        .mul(totalFeePercentage)
        .div(100);

      const manifest: FortuneManifestDto = {
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: fundAmountInWei.toString(),
        requestType: JobRequestType.FORTUNE,
      };

      getManifestMock.mockResolvedValue(manifest);

      const mockJobEntity: Partial<JobEntity> = {
        chainId,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        fee: totalFee.toString(),
        fundAmount: fundAmountInWei.toString(),
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      await jobService.launchJob(mockJobEntity as JobEntity);

      expect(mockTokenContract.transfer).toHaveBeenCalledWith(
        MOCK_ADDRESS,
        mockJobEntity.fundAmount,
      );
      expect(mockJobEntity.escrowAddress).toBe(MOCK_ADDRESS);
      expect(mockJobEntity.status).toBe(JobStatus.LAUNCHED);
      expect(mockJobEntity.save).toHaveBeenCalled();
      expect(jobService.getManifest).toHaveBeenCalledWith(
        mockJobEntity.manifestUrl,
      );
    });

    it('should throw an unpredictable gas limit error if transfer failed', async () => {
      const fundAmountInWei = ethers.utils.parseUnits('10', 'ether');

      const manifest: FortuneManifestDto = {
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: fundAmountInWei.toString(),
        requestType: JobRequestType.FORTUNE,
      };

      getManifestMock.mockResolvedValue(manifest);
      mockTokenContract.transfer.mockRejectedValue(
        Object.assign(
          new Error(ethers.utils.Logger.errors.UNPREDICTABLE_GAS_LIMIT),
          { code: ethers.utils.Logger.errors.UNPREDICTABLE_GAS_LIMIT },
        ),
      );

      const mockJobEntity: Partial<JobEntity> = {
        chainId,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      await expect(
        jobService.launchJob(mockJobEntity as JobEntity),
      ).rejects.toThrow(
        new Error(ethers.utils.Logger.errors.UNPREDICTABLE_GAS_LIMIT),
      );
    });

    it('should throw an error if the manifest does not exist', async () => {
      getManifestMock.mockResolvedValue(null!);

      const mockJobEntity: Partial<JobEntity> = {
        chainId,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      await expect(
        jobService.launchJob(mockJobEntity as JobEntity),
      ).rejects.toThrow();
    });

    it('should throw an error if the manifest validation failed', async () => {
      const invalidManifest: Partial<FortuneManifestDto> = {
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        requestType: JobRequestType.FORTUNE,
      };

      getManifestMock.mockResolvedValue(invalidManifest as FortuneManifestDto);

      const mockJobEntity: Partial<JobEntity> = {
        chainId,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      await expect(
        jobService.launchJob(mockJobEntity as JobEntity),
      ).rejects.toThrow();
    });

    it('should handle error during job launch', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        createAndSetupEscrow: jest.fn().mockRejectedValue(new Error()),
      }));

      const mockJobEntity: Partial<JobEntity> = {
        chainId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      await expect(
        jobService.launchJob(mockJobEntity as JobEntity),
      ).rejects.toThrow();
    });
  });

  describe('launchJob with CVAT type', () => {
    let getManifestMock: any;

    const mockTokenContract: any = {
      transfer: jest.fn(),
    };

    beforeEach(() => {
      jest
        .spyOn(HMToken__factory, 'connect')
        .mockReturnValue(mockTokenContract);
      getManifestMock = jest.spyOn(jobService, 'getManifest');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should launch a job successfully', async () => {
      const fundAmountInWei = ethers.utils.parseUnits('10', 'ether');

      const manifest: ImageLabelBinaryManifestDto = {
        dataUrl: MOCK_FILE_URL,
        labels: ['label1'],
        requesterAccuracyTarget: 1,
        submissionsRequired: 10,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: fundAmountInWei.toString(),
        requestType: JobRequestType.IMAGE_LABEL_BINARY,
      };

      jest.spyOn(jobService, 'getManifest').mockResolvedValue(manifest);
    });

    it('should throw an error if the manifest validation failed', async () => {
      const invalidManifest: Partial<ImageLabelBinaryManifestDto> = {
        dataUrl: MOCK_FILE_URL,
        labels: ['label1'],
        requesterAccuracyTarget: 1,
        submissionsRequired: 10,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        requestType: JobRequestType.IMAGE_LABEL_BINARY,
      };

      getManifestMock.mockResolvedValue(
        invalidManifest as ImageLabelBinaryManifestDto,
      );

      const mockJobEntity: Partial<JobEntity> = {
        chainId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      await expect(
        jobService.launchJob(mockJobEntity as JobEntity),
      ).rejects.toThrow();
    });
  });

  describe('saveManifest', () => {
    let uploadFilesMock: any;

    beforeEach(() => {
      uploadFilesMock = jest.spyOn(jobService.storageClient, 'uploadFiles');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should save the manifest and return the manifest URL and hash', async () => {
      const encryptedManifest = { data: 'encrypted data' };

      uploadFilesMock.mockResolvedValue([
        {
          url: MOCK_FILE_URL,
          hash: MOCK_FILE_HASH,
        },
      ]);

      const result = await jobService.saveManifest(
        encryptedManifest,
        MOCK_BUCKET_NAME,
      );

      expect(result).toEqual({
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
      });
      expect(jobService.storageClient.uploadFiles).toHaveBeenCalledWith(
        [encryptedManifest],
        MOCK_BUCKET_NAME,
      );
    });

    it('should throw an error if the manifest file fails to upload', async () => {
      const encryptedManifest = { data: 'encrypted data' };
      const uploadError = new Error(ErrorBucket.UnableSaveFile);

      uploadFilesMock.mockRejectedValue(uploadError);

      await expect(
        jobService.saveManifest(encryptedManifest, MOCK_BUCKET_NAME),
      ).rejects.toThrowError(
        new BadGatewayException(ErrorBucket.UnableSaveFile),
      );
      expect(jobService.storageClient.uploadFiles).toHaveBeenCalledWith(
        [encryptedManifest],
        MOCK_BUCKET_NAME,
      );
    });

    it('should rethrow any other errors encountered', async () => {
      const encryptedManifest = { data: 'encrypted data' };
      const errorMessage = 'Something went wrong';
      const uploadError = new Error(errorMessage);

      uploadFilesMock.mockRejectedValue(uploadError);

      await expect(
        jobService.saveManifest(encryptedManifest, MOCK_BUCKET_NAME),
      ).rejects.toThrowError(new Error(errorMessage));
      expect(jobService.storageClient.uploadFiles).toHaveBeenCalledWith(
        [encryptedManifest],
        MOCK_BUCKET_NAME,
      );
    });
  });

  describe('getManifest', () => {
    it('should download and return the manifest', async () => {
      const fundAmountInWei = ethers.utils.parseUnits('10', 'ether');

      const manifest: FortuneManifestDto = {
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: fundAmountInWei.toString(),
        requestType: JobRequestType.FORTUNE,
      };

      StorageClient.downloadFileFromUrl = jest.fn().mockReturnValue(manifest);

      const result = await jobService.getManifest(MOCK_FILE_URL);

      expect(StorageClient.downloadFileFromUrl).toHaveBeenCalledWith(
        MOCK_FILE_URL,
      );
      expect(result).toEqual(manifest);
    });

    it('should throw a NotFoundException if the manifest is not found', async () => {
      StorageClient.downloadFileFromUrl = jest.fn().mockResolvedValue(null);

      await expect(jobService.getManifest(MOCK_FILE_URL)).rejects.toThrowError(
        new NotFoundException(ErrorJob.ManifestNotFound),
      );
    });
  });

  describe('getManifest', () => {
    let downloadFileFromUrlMock: any;

    beforeEach(() => {
      downloadFileFromUrlMock = jest.spyOn(
        StorageClient,
        'downloadFileFromUrl',
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should download and return the manifest', async () => {
      const fundAmountInWei = ethers.utils.parseUnits('10', 'ether');
      const jobLauncherFee = BigNumber.from(MOCK_JOB_LAUNCHER_FEE)
        .div(100)
        .mul(fundAmountInWei);

      const usdTotalAmount = BigNumber.from(
        FixedNumber.from(
          ethers.utils.formatUnits(
            fundAmountInWei.add(jobLauncherFee),
            'ether',
          ),
        ).mulUnsafe(FixedNumber.from('10'.toString())),
      );

      const manifest: FortuneManifestDto = {
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: usdTotalAmount.toString(),
        requestType: JobRequestType.FORTUNE,
      };

      downloadFileFromUrlMock.mockReturnValue(manifest);

      const result = await jobService.getManifest(MOCK_FILE_URL);

      expect(StorageClient.downloadFileFromUrl).toHaveBeenCalledWith(
        MOCK_FILE_URL,
      );
      expect(result).toEqual(manifest);
    });

    it('should throw a NotFoundException if the manifest is not found', async () => {
      downloadFileFromUrlMock.mockResolvedValue(null);

      await expect(jobService.getManifest(MOCK_FILE_URL)).rejects.toThrowError(
        new NotFoundException(ErrorJob.ManifestNotFound),
      );
      expect(StorageClient.downloadFileFromUrl).toHaveBeenCalledWith(
        MOCK_FILE_URL,
      );
    });
  });
});
