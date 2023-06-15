import { ethers } from 'ethers';
import { Test } from '@nestjs/testing';
import {
  BadGatewayException,
  NotFoundException
} from '@nestjs/common';
import { MUMBAI_NETWORK } from 'nestjs-ethers';
import { JobService } from './job.service';
import { JobRepository } from './job.repository';
import { PaymentService } from '../payment/payment.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BigNumber } from 'ethers';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
  ChainId,
  EscrowClient,
  InitClient,
  NetworkData,
  NETWORKS,
  StorageClient,
  UploadFile
} from '@human-protocol/sdk';
import { PaymentSource, PaymentType } from '../../common/enums/payment';
import { JobMode, JobRequestType, JobStatus } from '../../common/enums/job';
import {
  EXCHANGE_ORACLE_WEBHOOK_URL,
  JOB_LAUNCHER_FEE,
  RECORDING_ORACLE_ADDRESS,
  RECORDING_ORACLE_FEE,
  REPUTATION_ORACLE_ADDRESS,
  REPUTATION_ORACLE_FEE,
} from '../../common/constants';
import { ErrorBucket, ErrorEscrow, ErrorJob } from '../../common/constants/errors';
import { JobFortuneDto, ManifestDto, SaveManifestDto } from './job.dto';
import { UserRepository } from '../user/user.repository';
import { UserStatus, UserType } from '../../common/enums/user';

const MOCK_REQUESTER_TITLE = 'Mock job title',
  MOCK_REQUESTER_DESCRIPTION = 'Mock job description',
  MOCK_FORTUNES_REQUIRED = 5,
  MOCK_CHAIN_ID = 1,
  MOCK_ADDRESS = '0x1234567890abcdef',
  MOCK_FILE_URL = 'mockedFileUrl',
  MOCK_FILE_HASH = 'mockedFileHash',
  MOCK_FILE_KEY = 'manifest.json',
  MOCK_PRIVATE_KEY =
    'd334daf65a631f40549cc7de126d5a0016f32a2d00c49f94563f9737f7135e55',
  MOCK_BUCKET_NAME = 'bucket-name';

jest.mock('@human-protocol/sdk');

describe('JobService', () => {
  let jobService: JobService;
  let jobRepository: DeepMocked<JobRepository>;
  let userRepository: DeepMocked<UserRepository>;
  let paymentService: DeepMocked<PaymentService>;
  let configService: DeepMocked<ConfigService>;
  let httpService: DeepMocked<HttpService>;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JobService,
        { provide: JobRepository, useValue: createMock<JobRepository>() },
        { provide: UserRepository, useValue: createMock<UserRepository>() },
        { provide: PaymentService, useValue: createMock<PaymentService>() },
        { provide: ConfigService, useValue: createMock<ConfigService>() },
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    jobService = moduleRef.get<JobService>(JobService);
    jobRepository = moduleRef.get(JobRepository);
    userRepository = moduleRef.get(UserRepository);
    paymentService = moduleRef.get(PaymentService);
    configService = moduleRef.get(ConfigService);
    httpService = moduleRef.get(HttpService);
  });

  describe('createFortuneJob', () => {
    it('should create a fortune job successfully', async () => {
      const fundAmount = 1; // ETH

      jest
        .spyOn(StorageClient.prototype, 'uploadFiles')
        .mockResolvedValue([{ key: MOCK_FILE_KEY, hash: MOCK_FILE_HASH }]);
      jest.spyOn(jobService, 'createFileUrl').mockReturnValue(MOCK_FILE_URL);
      const userId = 1;
      const dto = {
        chainId: MOCK_CHAIN_ID,
        fortunesRequired: MOCK_FORTUNES_REQUIRED,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount,
      };

      const userBalance = ethers.utils.parseUnits('10', 'ether'); // 10 ETH

      const fundAmountInWei = ethers.utils.parseUnits(
        dto.fundAmount.toString(),
        'ether',
      );

      const totalFeePercentage = BigNumber.from(JOB_LAUNCHER_FEE)
        .add(RECORDING_ORACLE_FEE)
        .add(REPUTATION_ORACLE_FEE);
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
        .mockResolvedValue([{ key: MOCK_FILE_KEY, hash: MOCK_FILE_HASH }]);
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
        .mockResolvedValue([{ key: MOCK_FILE_KEY, hash: MOCK_FILE_HASH }]);
      jest.spyOn(jobService, 'saveManifest').mockResolvedValue(saveManifestDto);
      jest.spyOn(jobRepository, 'create').mockResolvedValue(undefined);

      const userBalance = ethers.utils.parseUnits('10', 'ether'); // 10 ETH
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
    let escrowClient: any, mockSigner: any;

    beforeEach(async () => {
      mockSigner = {
        ...provider.getSigner(),
        getAddress: jest.fn().mockReturnValue(ethers.constants.AddressZero),
      };

      const chainId: ChainId = MUMBAI_NETWORK.chainId;
      const networkData = NETWORKS[chainId];

      const getClientParamsMock = InitClient.getParams as jest.Mock;
      getClientParamsMock.mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      escrowClient = new EscrowClient(await InitClient.getParams(mockSigner));
    });

    it('should launch a job successfully', async () => {
      const chainId: ChainId = MUMBAI_NETWORK.chainId;
      const networkData = NETWORKS[chainId];

      jest.spyOn(InitClient, 'getParams').mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      jest
        .spyOn(EscrowClient.prototype, 'createAndSetupEscrow')
        .mockResolvedValue(MOCK_ADDRESS);

      jest.spyOn(configService, 'get').mockReturnValue(MOCK_PRIVATE_KEY);

      const fundAmount = ethers.utils.parseUnits('10', 'ether'); // 1 ETH
      const fee = ethers.utils.parseUnits('1', 'ether'); // 1 ETH

      jest.spyOn(jobService, 'getManifest').mockResolvedValue({
        dataUrl: MOCK_FILE_URL,
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: fundAmount.toString(),
        requestType: JobRequestType.FORTUNE,
        mode: JobMode.DESCRIPTIVE,
      });

      const mockJobEntity = {
        id: 1,
        chainId: 1,
        userId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        status: JobStatus.PENDING,
        fee: fee.toString(),
        fundAmount: fundAmount.toString(),
        retriesCount: 0,
        waitUntil: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        beforeInsert: jest.fn().mockResolvedValue(true),
        beforeUpdate: jest.fn().mockResolvedValue(true),
        user: {
          id: 123,
          password: 'HUMAN',
          email: 'human@hmt.ai',
          confirm: 'human',
          type: UserType.REQUESTER,
          status: UserStatus.ACTIVE,
          stripeCustomerId: '123',
          jobs: [],
          payments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          save: jest.fn().mockResolvedValue(true),
          hasId: jest.fn().mockResolvedValue(true),
          remove: jest.fn().mockResolvedValue(true),
          softRemove: jest.fn().mockResolvedValue(true),
          recover: jest.fn().mockResolvedValue(true),
          reload: jest.fn().mockResolvedValue(true),
          beforeInsert: jest.fn().mockResolvedValue(true),
          beforeUpdate: jest.fn().mockResolvedValue(true),
        },
        save: jest.fn().mockResolvedValue(true),
        hasId: jest.fn().mockResolvedValue(true),
        remove: jest.fn().mockResolvedValue(true),
        softRemove: jest.fn().mockResolvedValue(true),
        recover: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(true),
      };

      const jobEntity = await jobService.launchJob(mockJobEntity);

      expect(EscrowClient.prototype.createAndSetupEscrow).toHaveBeenCalledWith(
        networkData?.hmtAddress,
        [],
        {
          recordingOracle: RECORDING_ORACLE_ADDRESS,
          reputationOracle: REPUTATION_ORACLE_ADDRESS,
          recordingOracleFee: BigNumber.from(RECORDING_ORACLE_FEE),
          reputationOracleFee: BigNumber.from(REPUTATION_ORACLE_FEE),
          manifestUrl: mockJobEntity.manifestUrl,
          manifestHash: mockJobEntity.manifestHash,
        },
      );
      expect(jobEntity.escrowAddress).toBe(MOCK_ADDRESS);
      expect(jobEntity.status).toBe(JobStatus.LAUNCHED);
      expect(jobEntity.save).toHaveBeenCalled();
      expect(jobService.getManifest).toHaveBeenCalledWith(
        jobEntity.manifestUrl,
      );
    });

    it('should handle error during job launch', async () => {
      const chainId: ChainId = MUMBAI_NETWORK.chainId;
      const networkData = NETWORKS[chainId];

      jest.spyOn(InitClient, 'getParams').mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      jest.spyOn(configService, 'get').mockReturnValue(MOCK_PRIVATE_KEY);

      jest
        .spyOn(EscrowClient.prototype, 'createAndSetupEscrow')
        .mockRejectedValue(new Error(ErrorEscrow.NotLaunched));

      const fundAmount = ethers.utils.parseUnits('10', 'ether'); // 1 ETH
      const fee = ethers.utils.parseUnits('1', 'ether'); // 1 ETH

      const mockJobEntity = {
        id: 1,
        chainId: 1,
        userId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: '',
        status: JobStatus.PENDING,
        fee: fee.toString(),
        fundAmount: fundAmount.toString(),
        retriesCount: 0,
        waitUntil: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        beforeInsert: jest.fn().mockResolvedValue(true),
        beforeUpdate: jest.fn().mockResolvedValue(true),
        user: {
          id: 123,
          password: 'HUMAN',
          email: 'human@hmt.ai',
          confirm: 'human',
          type: UserType.REQUESTER,
          status: UserStatus.ACTIVE,
          stripeCustomerId: '123',
          jobs: [],
          payments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          save: jest.fn().mockResolvedValue(true),
          hasId: jest.fn().mockResolvedValue(true),
          remove: jest.fn().mockResolvedValue(true),
          softRemove: jest.fn().mockResolvedValue(true),
          recover: jest.fn().mockResolvedValue(true),
          reload: jest.fn().mockResolvedValue(true),
          beforeInsert: jest.fn().mockResolvedValue(true),
          beforeUpdate: jest.fn().mockResolvedValue(true),
        },
        save: jest.fn().mockResolvedValue(true),
        hasId: jest.fn().mockResolvedValue(true),
        remove: jest.fn().mockResolvedValue(true),
        softRemove: jest.fn().mockResolvedValue(true),
        recover: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(true),
      };

      expect(jobService.launchJob(mockJobEntity)).rejects.toThrow();

      expect(
        EscrowClient.prototype.createAndSetupEscrow,
      ).not.toHaveBeenCalled();
      expect(mockJobEntity.save).not.toHaveBeenCalled();
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

      const chainId: ChainId = MUMBAI_NETWORK.chainId;
      const networkData = NETWORKS[chainId];

      const getClientParamsMock = InitClient.getParams as jest.Mock;
      getClientParamsMock.mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      escrowClient = new EscrowClient(await InitClient.getParams(mockSigner));
    });

    it('should launch a job successfully', async () => {
      const chainId: ChainId = MUMBAI_NETWORK.chainId;
      const networkData = NETWORKS[chainId];

      jest.spyOn(InitClient, 'getParams').mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      jest
        .spyOn(EscrowClient.prototype, 'createAndSetupEscrow')
        .mockResolvedValue(MOCK_ADDRESS);

      jest.spyOn(configService, 'get').mockReturnValue(MOCK_PRIVATE_KEY);

      const fundAmount = ethers.utils.parseUnits('10', 'ether'); // 1 ETH
      const fee = ethers.utils.parseUnits('1', 'ether'); // 1 ETH

      jest.spyOn(jobService, 'getManifest').mockResolvedValue({
        dataUrl: MOCK_FILE_URL,
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: fundAmount.toString(),
        requestType: JobRequestType.FORTUNE,
        mode: JobMode.DESCRIPTIVE,
      });
    });

    it('should handle error during job launch', async () => {
      const chainId: ChainId = MUMBAI_NETWORK.chainId;
      const networkData = NETWORKS[chainId];

      jest.spyOn(InitClient, 'getParams').mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      jest.spyOn(configService, 'get').mockReturnValue(MOCK_PRIVATE_KEY);

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
        { key: MOCK_FILE_KEY, hash: MOCK_FILE_HASH },
      ];
  
      jest
        .spyOn(StorageClient.prototype, 'uploadFiles')
        .mockResolvedValue(uploadResult);
      jest.spyOn(jobService, 'createFileUrl').mockReturnValue(MOCK_FILE_URL);
  
      const result = await jobService.saveManifest(encryptedManifest, MOCK_BUCKET_NAME);
  
      expect(StorageClient.prototype.uploadFiles).toHaveBeenCalledWith(
        [encryptedManifest],
        MOCK_BUCKET_NAME
      );
      expect(jobService.createFileUrl).toHaveBeenCalledWith(MOCK_FILE_KEY);
      expect(result).toEqual({
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
      });
    });
  
    it('should throw an error if the manifest file fails to upload', async () => {
      const encryptedManifest = { data: 'encrypted data' };
      const uploadResult: UploadFile[] = [];
  
      jest.spyOn(StorageClient.prototype, 'uploadFiles').mockResolvedValue(uploadResult);
  
      await expect(jobService.saveManifest(encryptedManifest, MOCK_BUCKET_NAME)).rejects.toThrowError(
        new BadGatewayException(ErrorBucket.UnableSaveFile)
      );
    });
  
    it('should rethrow any other errors encountered', async () => {
      const encryptedManifest = { data: 'encrypted data' };
      const errorMessage = 'Something went wrong';
  
      jest.spyOn(StorageClient.prototype, 'uploadFiles').mockRejectedValue(new Error(errorMessage));
  
      await expect(jobService.saveManifest(encryptedManifest, MOCK_BUCKET_NAME)).rejects.toThrowError(
        new Error(errorMessage)
      );
    });
  });

  describe('getManifest', () => {
    it('should download and return the manifest', async () => {
      const manifest: ManifestDto = {
        chainId: MOCK_CHAIN_ID,
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: 10,
        mode: JobMode.DESCRIPTIVE,
        requestType: JobRequestType.FORTUNE,
      };

      jest.spyOn(StorageClient, 'downloadFileFromUrl').mockResolvedValue(manifest);

      const result = await jobService.getManifest(MOCK_FILE_URL);

      expect(StorageClient.downloadFileFromUrl).toHaveBeenCalledWith(MOCK_FILE_URL);
      expect(result).toEqual(manifest);
    });

    it('should throw a NotFoundException if the manifest is not found', async () => {
      jest.spyOn(StorageClient, 'downloadFileFromUrl').mockResolvedValue(null);

      await expect(jobService.getManifest(MOCK_FILE_URL)).rejects.toThrowError(
        new NotFoundException(ErrorJob.ManifestNotFound)
      );
    });
  });

  /*describe('sendWebhook', () => {
    let httpService: HttpService;
    let jobService: JobService;
    const webhookUrl = 'https://example.com/webhook';
    const webhookData: SendWebhookDto = {
    };
  
    beforeEach(() => {
      httpService = new HttpService();
      jobService = new JobService(httpService);
    });
  
    it('should send the webhook successfully', async () => {
      const response = {
        data: 'Webhook sent successfully',
      };
  
      jest.spyOn(httpService, 'post').mockReturnValueOnce(
        Promise.resolve({
          data: response,
        })
      );
  
      const result = await jobService.sendWebhook(webhookUrl, webhookData);
  
      expect(httpService.post).toHaveBeenCalledWith(webhookUrl, webhookData);
      expect(result).toBe(true);
    });
  
    it('should throw a NotFoundException if the webhook was not sent', async () => {
      jest.spyOn(httpService, 'post').mockReturnValueOnce(
        Promise.resolve({
          data: null,
        })
      );
  
      await expect(jobService.sendWebhook(webhookUrl, webhookData)).rejects.toThrowError(
        new NotFoundException(ErrorJob.WebhookWasNotSent)
      );
    });
  }); */
});
