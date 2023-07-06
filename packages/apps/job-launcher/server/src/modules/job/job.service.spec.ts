import { ContractTransaction, ethers } from 'ethers';
import { Test } from '@nestjs/testing';
import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { JobService } from './job.service';
import { JobRepository } from './job.repository';
import { PaymentService } from '../payment/payment.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BigNumber } from 'ethers';
import { createMock } from '@golevelup/ts-jest';
import {
  ChainId,
  EscrowClient,
  InitClient,
  NetworkData,
  NETWORKS,
  StorageClient,
  UploadFile,
} from '@human-protocol/sdk';
import { PaymentSource, PaymentType } from '../../common/enums/payment';
import { JobMode, JobRequestType, JobStatus } from '../../common/enums/job';
import {
  ErrorBucket,
  ErrorEscrow,
  ErrorJob,
} from '../../common/constants/errors';
import { FortuneManifestDto, ImageLabelBinaryManifestDto, JobFortuneDto, SaveManifestDto } from './job.dto';
import { JobEntity } from './job.entity';
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
  MOCK_TRANSACTION_HASH,
} from '../../common/test/constants';
import { Web3Service } from '../web3/web3.service';
import { HMToken, HMToken__factory } from '@human-protocol/core/typechain-types';

jest.mock('@human-protocol/sdk');

describe('JobService', () => {
  let jobService: JobService;
  let web3Service: Web3Service;
  let jobRepository: JobRepository;
  let paymentService: PaymentService;
  let configService: ConfigService;
  let httpService: HttpService;

  const signerMock = {
    address: '0x1234567890123456789012345678901234567892',
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeEach(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string, defaultValue?: any) => {
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
        { provide: JobRepository, useValue: createMock<JobRepository>() },
        { provide: PaymentService, useValue: createMock<PaymentService>() },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    jobService = moduleRef.get<JobService>(JobService);
    jobRepository = moduleRef.get(JobRepository);
    paymentService = moduleRef.get(PaymentService);
    configService = moduleRef.get(ConfigService);
    httpService = moduleRef.get(HttpService);
  });

  describe('createFortuneJob', () => {
    it('should create a fortune job successfully', async () => {
      jest
        .spyOn(StorageClient.prototype, 'uploadFiles')
        .mockResolvedValue([{ key: MOCK_FILE_KEY, url: MOCK_FILE_URL, hash: MOCK_FILE_HASH }]);

      const userId = 1;
      const dto = {
        chainId: MOCK_CHAIN_ID,
        fortunesRequired: MOCK_FORTUNES_REQUIRED,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: 10,
      };

      const userBalance = ethers.utils.parseUnits('15', 'ether'); // 15 ETH

      const fundAmountInWei = ethers.utils.parseUnits(
        dto.fundAmount.toString(),
        'ether',
      );
      const totalFeePercentage = BigNumber.from(MOCK_JOB_LAUNCHER_FEE)
        .add(MOCK_RECORDING_ORACLE_FEE)
        .add(MOCK_REPUTATION_ORACLE_FEE);
      const totalFee = BigNumber.from(fundAmountInWei)
        .mul(totalFeePercentage)
        .div(100);
      const totalAmount = BigNumber.from(fundAmountInWei).add(totalFee);

      jest
        .spyOn(paymentService, 'getUserBalance')
        .mockResolvedValue(userBalance);
      jest.spyOn(paymentService, 'savePayment').mockResolvedValue(true);

      const result = await jobService.createFortuneJob(userId, dto);
      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
      expect(paymentService.savePayment).toHaveBeenCalledWith(
        userId,
        PaymentSource.BALANCE,
        PaymentType.WITHDRAWAL,
        BigNumber.from(totalAmount),
      );
      expect(jobRepository.create).toHaveBeenCalledWith({
        chainId: dto.chainId,
        userId,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        fee: totalFee.toString(),
        fundAmount: totalAmount.toString(),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
      });
    });

    it('should throw an exception for insufficient user balance', async () => {
      const fundAmount = 10; // ETH

      const saveManifestDto: SaveManifestDto = {
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
      };

      jest
        .spyOn(StorageClient.prototype, 'uploadFiles')
        .mockResolvedValue([{ key: MOCK_FILE_KEY, url: MOCK_FILE_URL, hash: MOCK_FILE_HASH }]);
      jest.spyOn(jobService, 'saveManifest').mockResolvedValue(saveManifestDto);

      const userBalance = ethers.utils.parseUnits('1', 'ether'); // 1 ETH
      jest
        .spyOn(paymentService, 'getUserBalance')
        .mockResolvedValue(userBalance);

      const userId = 1;

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

      const saveManifestDto: SaveManifestDto = {
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
      };

      jest
        .spyOn(StorageClient.prototype, 'uploadFiles')
        .mockResolvedValue([{ key: MOCK_FILE_KEY, url: MOCK_FILE_URL, hash: MOCK_FILE_HASH }]);
      jest.spyOn(jobService, 'saveManifest').mockResolvedValue(saveManifestDto);
      jest.spyOn(jobRepository, 'create').mockResolvedValue(undefined);

      const userBalance = ethers.utils.parseUnits('15', 'ether'); // 10 ETH
      jest
        .spyOn(paymentService, 'getUserBalance')
        .mockResolvedValue(userBalance);

      const userId = 1;

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
    const provider = new ethers.providers.JsonRpcProvider();
    let escrowClient: any, mockSigner: any, mockTokenContract: any;

    beforeEach(async () => {
      mockSigner = {
        ...provider.getSigner(),
        getAddress: jest.fn().mockReturnValue(ethers.constants.AddressZero),
      };

      const chainId: ChainId = 80001;
      const networkData = NETWORKS[chainId];

      const getClientParamsMock = InitClient.getParams as jest.Mock;
      getClientParamsMock.mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      // Mock HMToken__factory.connect to return the mock HMToken
      mockTokenContract = {
        transfer: jest.fn(),
      };

      escrowClient = new EscrowClient(await InitClient.getParams(mockSigner));
    });

    it('should launch a job successfully', async () => {
      const chainId: ChainId = 80001;
      const networkData = NETWORKS[chainId];

      jest.spyOn(InitClient, 'getParams').mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      jest
        .spyOn(EscrowClient.prototype, 'createAndSetupEscrow')
        .mockResolvedValue(MOCK_ADDRESS);
        
      const fundAmountInWei = ethers.utils.parseUnits(
        '10',
        'ether',
      );
      const totalFeePercentage = BigNumber.from(MOCK_JOB_LAUNCHER_FEE)
        .add(MOCK_RECORDING_ORACLE_FEE)
        .add(MOCK_REPUTATION_ORACLE_FEE);
      const totalFee = BigNumber.from(fundAmountInWei)
        .mul(totalFeePercentage)
        .div(100);
      const totalAmount = BigNumber.from(fundAmountInWei).add(totalFee);
      
      const manifest: FortuneManifestDto = {
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fee: totalFee.toString(),
        fundAmount: totalAmount.toString(),
        requestType: JobRequestType.FORTUNE,
        mode: JobMode.DESCRIPTIVE,
      }

      jest.spyOn(jobService, 'getManifest').mockResolvedValue(manifest);

      const mockJobEntity: Partial<JobEntity> = {
        chainId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        fee: totalFee.toString(),
        fundAmount: totalAmount.toString(),
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(HMToken__factory, 'connect').mockReturnValue(mockTokenContract);

      jest.spyOn(mockTokenContract, 'transfer').mockResolvedValue({
        chainId: 1,
        hash: MOCK_TRANSACTION_HASH,
      } as ContractTransaction);

      const jobEntity = await jobService.launchJob(mockJobEntity as JobEntity);

      expect(EscrowClient.prototype.createAndSetupEscrow).toHaveBeenCalledWith(
        networkData?.hmtAddress,
        [],
        {
          recordingOracle: MOCK_RECORDING_ORACLE_ADDRESS,
          reputationOracle: MOCK_REPUTATION_ORACLE_ADDRESS,
          recordingOracleFee: BigNumber.from(MOCK_RECORDING_ORACLE_FEE),
          reputationOracleFee: BigNumber.from(MOCK_REPUTATION_ORACLE_FEE),
          manifestUrl: mockJobEntity.manifestUrl,
          manifestHash: mockJobEntity.manifestHash,
        },
      );
      expect(mockTokenContract.transfer).toHaveBeenCalledWith(MOCK_ADDRESS, jobEntity.fundAmount);
      expect(jobEntity.escrowAddress).toBe(MOCK_ADDRESS);
      expect(jobEntity.status).toBe(JobStatus.LAUNCHED);
      expect(jobEntity.save).toHaveBeenCalled();
      expect(jobService.getManifest).toHaveBeenCalledWith(
        jobEntity.manifestUrl,
      );
    });

    it('should throw an unpredictable gas limit error if transfer failed', async () => {
      const chainId: ChainId = 80001;
      const networkData = NETWORKS[chainId];

      jest.spyOn(InitClient, 'getParams').mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      jest
        .spyOn(EscrowClient.prototype, 'createAndSetupEscrow')
        .mockResolvedValue(MOCK_ADDRESS);

      const fundAmountInWei = ethers.utils.parseUnits(
        '10',
        'ether',
      );
      const totalFeePercentage = BigNumber.from(MOCK_JOB_LAUNCHER_FEE)
        .add(MOCK_RECORDING_ORACLE_FEE)
        .add(MOCK_REPUTATION_ORACLE_FEE);
      const totalFee = BigNumber.from(fundAmountInWei)
        .mul(totalFeePercentage)
        .div(100);
      const totalAmount = BigNumber.from(fundAmountInWei).add(totalFee);
      
      const manifest: FortuneManifestDto = {
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fee: totalFee.toString(),
        fundAmount: totalAmount.toString(),
        requestType: JobRequestType.FORTUNE,
        mode: JobMode.DESCRIPTIVE,
      }

      jest.spyOn(jobService, 'getManifest').mockResolvedValue(manifest);

      jest.spyOn(HMToken__factory, 'connect').mockReturnValue(mockTokenContract);
    
      jest.spyOn(mockTokenContract, 'transfer').mockRejectedValue(Object.assign(new Error(ethers.utils.Logger.errors.UNPREDICTABLE_GAS_LIMIT), { code: ethers.utils.Logger.errors.UNPREDICTABLE_GAS_LIMIT }));

      const mockJobEntity: Partial<JobEntity> = {
        chainId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      expect(
        jobService.launchJob(mockJobEntity as JobEntity),
      ).rejects.toThrow(new Error(`Unpredictable gas limit: ${ethers.utils.Logger.errors.UNPREDICTABLE_GAS_LIMIT}`));
    });

    it('should throw an error if the manifest does not exist', async () => {
      const chainId: ChainId = 80001;
      const networkData = NETWORKS[chainId];

      jest.spyOn(InitClient, 'getParams').mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      jest
        .spyOn(EscrowClient.prototype, 'createAndSetupEscrow')
        .mockResolvedValue(MOCK_ADDRESS);

      jest
        .spyOn(jobService, 'getManifest')
        .mockResolvedValue(null!);

      const mockJobEntity: Partial<JobEntity> = {
        chainId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      expect(
        jobService.launchJob(mockJobEntity as JobEntity),
      ).rejects.toThrow();
    });

    it('should throw an error if the manifest validation failed', async () => {
      const chainId: ChainId = 80001;
      const networkData = NETWORKS[chainId];

      jest.spyOn(InitClient, 'getParams').mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      jest
        .spyOn(EscrowClient.prototype, 'createAndSetupEscrow')
        .mockResolvedValue(MOCK_ADDRESS);

        const invalidManifest: Partial<FortuneManifestDto> = {
          submissionsRequired: 10,
          requesterTitle: MOCK_REQUESTER_TITLE,
          requesterDescription: MOCK_REQUESTER_DESCRIPTION,
          requestType: JobRequestType.FORTUNE,
          mode: JobMode.DESCRIPTIVE,
        }
  
      jest.spyOn(jobService, 'getManifest').mockResolvedValue(invalidManifest as FortuneManifestDto);

      const mockJobEntity: Partial<JobEntity> = {
        chainId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      expect(
        jobService.launchJob(mockJobEntity as JobEntity),
      ).rejects.toThrow();
    });

    it('should handle error during job launch', async () => {
      const chainId: ChainId = 80001;
      const networkData = NETWORKS[chainId];

      jest.spyOn(InitClient, 'getParams').mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      jest
        .spyOn(EscrowClient.prototype, 'createAndSetupEscrow')
        .mockRejectedValue(new Error(ErrorEscrow.NotLaunched));

      const mockJobEntity: Partial<JobEntity> = {
        chainId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      expect(
        jobService.launchJob(mockJobEntity as JobEntity),
      ).rejects.toThrow();
    });
  });

  describe('launchJob with CVAT type', () => {
    const provider = new ethers.providers.JsonRpcProvider();
    let escrowClient: any, mockSigner: any;

    beforeEach(async () => {
      mockSigner = {
        ...provider.getSigner(),
        getAddress: jest.fn().mockReturnValue(ethers.constants.AddressZero),
      };

      const chainId: ChainId = 80001;
      const networkData = NETWORKS[chainId];

      const getClientParamsMock = InitClient.getParams as jest.Mock;
      getClientParamsMock.mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      escrowClient = new EscrowClient(await InitClient.getParams(mockSigner));
    });

    it('should launch a job successfully', async () => {
      const chainId: ChainId = 80001;
      const networkData = NETWORKS[chainId];

      jest.spyOn(InitClient, 'getParams').mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      jest
        .spyOn(EscrowClient.prototype, 'createAndSetupEscrow')
        .mockResolvedValue(MOCK_ADDRESS);

      const fundAmountInWei = ethers.utils.parseUnits(
        '10',
        'ether',
      );
      const totalFeePercentage = BigNumber.from(MOCK_JOB_LAUNCHER_FEE)
        .add(MOCK_RECORDING_ORACLE_FEE)
        .add(MOCK_REPUTATION_ORACLE_FEE);
      const totalFee = BigNumber.from(fundAmountInWei)
        .mul(totalFeePercentage)
        .div(100);
      const totalAmount = BigNumber.from(fundAmountInWei).add(totalFee);

      const manifest: ImageLabelBinaryManifestDto = {
        dataUrl: MOCK_FILE_URL,
        labels: ['label1'],
        requesterAccuracyTarget: 1,
        submissionsRequired: 10,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fee: totalFee.toString(),
        fundAmount: totalAmount.toString(),
        requestType: JobRequestType.IMAGE_LABEL_BINARY,
        mode: JobMode.DESCRIPTIVE,
      }

      jest.spyOn(jobService, 'getManifest').mockResolvedValue(manifest);
    });

    it('should throw an error if the manifest validation failed', async () => {
      const chainId: ChainId = 80001;
      const networkData = NETWORKS[chainId];

      jest.spyOn(InitClient, 'getParams').mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      jest
        .spyOn(EscrowClient.prototype, 'createAndSetupEscrow')
        .mockResolvedValue(MOCK_ADDRESS);

        const invalidManifest: Partial<ImageLabelBinaryManifestDto> = {
          dataUrl: MOCK_FILE_URL,
          labels: ['label1'],
          requesterAccuracyTarget: 1,
          submissionsRequired: 10,
          requesterDescription: MOCK_REQUESTER_DESCRIPTION,
          requestType: JobRequestType.IMAGE_LABEL_BINARY,
          mode: JobMode.DESCRIPTIVE,
        }
  
      jest.spyOn(jobService, 'getManifest').mockResolvedValue(invalidManifest as ImageLabelBinaryManifestDto);

      const mockJobEntity: Partial<JobEntity> = {
        chainId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      expect(
        jobService.launchJob(mockJobEntity as JobEntity),
      ).rejects.toThrow();
    });

    it('should handle error during job launch', async () => {
      const chainId: ChainId = 80001;
      const networkData = NETWORKS[chainId];

      jest.spyOn(InitClient, 'getParams').mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      jest
        .spyOn(EscrowClient.prototype, 'createAndSetupEscrow')
        .mockRejectedValue(new Error(ErrorEscrow.NotLaunched));

      const fundAmount = ethers.utils.parseUnits('10', 'ether'); // 1 ETH
      const fee = ethers.utils.parseUnits('1', 'ether'); // 1 ETH
    });
  });

  describe('saveManifest', () => {
    it('should save the manifest and return the manifest URL and hash', async () => {
      const encryptedManifest = { data: 'encrypted data' };

      const uploadResult: UploadFile[] = [
        { key: MOCK_FILE_KEY, url: MOCK_FILE_URL, hash: MOCK_FILE_HASH },
      ];

      jest
        .spyOn(StorageClient.prototype, 'uploadFiles')
        .mockResolvedValue(uploadResult);

      const result = await jobService.saveManifest(
        encryptedManifest,
        MOCK_BUCKET_NAME,
      );

      expect(StorageClient.prototype.uploadFiles).toHaveBeenCalledWith(
        [encryptedManifest],
        MOCK_BUCKET_NAME,
      );
      expect(result).toEqual({
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
      });
    });

    it('should throw an error if the manifest file fails to upload', async () => {
      const encryptedManifest = { data: 'encrypted data' };
      const uploadResult: UploadFile[] = [];

      jest
        .spyOn(StorageClient.prototype, 'uploadFiles')
        .mockResolvedValue(uploadResult);

      await expect(
        jobService.saveManifest(encryptedManifest, MOCK_BUCKET_NAME),
      ).rejects.toThrowError(
        new BadGatewayException(ErrorBucket.UnableSaveFile),
      );
    });

    it('should rethrow any other errors encountered', async () => {
      const encryptedManifest = { data: 'encrypted data' };
      const errorMessage = 'Something went wrong';

      jest
        .spyOn(StorageClient.prototype, 'uploadFiles')
        .mockRejectedValue(new Error(errorMessage));

      await expect(
        jobService.saveManifest(encryptedManifest, MOCK_BUCKET_NAME),
      ).rejects.toThrowError(new Error(errorMessage));
    });
  });

  describe('getManifest', () => {
    it('should download and return the manifest', async () => {
      const fundAmountInWei = ethers.utils.parseUnits(
        '10',
        'ether',
      );
      const totalFeePercentage = BigNumber.from(MOCK_JOB_LAUNCHER_FEE)
        .add(MOCK_RECORDING_ORACLE_FEE)
        .add(MOCK_REPUTATION_ORACLE_FEE);
      const totalFee = BigNumber.from(fundAmountInWei)
        .mul(totalFeePercentage)
        .div(100);
      const totalAmount = BigNumber.from(fundAmountInWei).add(totalFee);

      const manifest: FortuneManifestDto = {
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fee: totalFee.toString(),
        fundAmount: totalAmount.toString(),
        mode: JobMode.DESCRIPTIVE,
        requestType: JobRequestType.FORTUNE,
      };

      jest
        .spyOn(StorageClient, 'downloadFileFromUrl')
        .mockResolvedValue(manifest);

      const result = await jobService.getManifest(MOCK_FILE_URL);

      expect(StorageClient.downloadFileFromUrl).toHaveBeenCalledWith(
        MOCK_FILE_URL,
      );
      expect(result).toEqual(manifest);
    });

    it('should throw a NotFoundException if the manifest is not found', async () => {
      jest.spyOn(StorageClient, 'downloadFileFromUrl').mockResolvedValue(null);

      await expect(jobService.getManifest(MOCK_FILE_URL)).rejects.toThrowError(
        new NotFoundException(ErrorJob.ManifestNotFound),
      );
    });
  });
});
