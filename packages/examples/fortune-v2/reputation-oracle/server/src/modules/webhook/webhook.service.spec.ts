import { Test } from '@nestjs/testing';
import { WebhookService } from './webhook.service';
import { WebhookRepository } from './webhook.repository';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createMock } from '@golevelup/ts-jest';
import { ReputationService } from '../reputation/reputation.service';
import { Web3Service } from '../web3/web3.service';
import { FinalResult, ManifestDto, WebhookIncomingDto } from './webhook.dto';
import { ChainId, EscrowClient, InitClient, NETWORKS, NetworkData, StorageClient } from '@human-protocol/sdk';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { BigNumber, ethers } from 'ethers';
import { ReputationRepository } from '../reputation/reputation.repository';
import { ErrorWebhook } from '../../common/constants/errors';
import { JobMode, JobRequestType } from '../../common/enums/job';
import { MOCK_ADDRESS, MOCK_FILE_HASH, MOCK_FILE_KEY, MOCK_FILE_URL, MOCK_JOB_LAUNCHER_FEE, MOCK_RECORDING_ORACLE_FEE, MOCK_REPUTATION_ORACLE_FEE, MOCK_REQUESTER_DESCRIPTION, MOCK_REQUESTER_TITLE } from '../../common/test/constants';
import { WebhookStatus } from '../../common/decorators';

jest.mock('@human-protocol/sdk');

describe('WebhookService', () => {
  let webhookService: WebhookService;
  let web3Service: Web3Service;
  let reputationService: ReputationService;
  let reputationRepository: ReputationRepository;
  let webhookRepository: WebhookRepository;
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
          case 'S3_ENDPOINT':
            return '127.0.0.1';
          case 'S3_PORT':
            return 9000;
          case 'S3_USE_SSL':
            return false;
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
        WebhookService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        ReputationService,
        { provide: ReputationRepository, useValue: createMock<ReputationRepository>() },
        { provide: WebhookRepository, useValue: createMock<WebhookRepository>() },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    webhookService = moduleRef.get<WebhookService>(WebhookService);
    web3Service = moduleRef.get<Web3Service>(Web3Service);
    reputationService = moduleRef.get<ReputationService>(ReputationService);
    reputationRepository = moduleRef.get(ReputationRepository);
    webhookRepository = moduleRef.get(WebhookRepository);
    configService = moduleRef.get(ConfigService);
    httpService = moduleRef.get(HttpService);
  });

  describe('createIncomingWebhook', () => {
    it('should create an incoming webhook entity and return true', async () => {
      const dto: WebhookIncomingDto = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: '0x123456789',
      };

      jest.spyOn(webhookRepository, 'create').mockResolvedValueOnce({ id: 1 } as any);

      const result = await webhookService.createIncomingWebhook(dto);

      expect(webhookRepository.create).toHaveBeenCalledWith({
        chainId: dto.chainId,
        escrowAddress: dto.escrowAddress,
        status: 'PENDING',
        waitUntil: expect.any(Date),
      });
      expect(result).toBe(true);
    });

    it('should throw NotFoundException if webhook entity is not created', async () => {
      const dto: WebhookIncomingDto = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: '0x123456789',
      };

      jest.spyOn(webhookRepository, 'create').mockResolvedValueOnce(undefined as any);

      await expect(webhookService.createIncomingWebhook(dto)).rejects.toThrow(ErrorWebhook.NotCreated);
      expect(webhookRepository.create).toHaveBeenCalledWith({
        chainId: dto.chainId,
        escrowAddress: dto.escrowAddress,
        status: 'PENDING',
        waitUntil: expect.any(Date),
      });
    });
  });

  describe('processPendingWebhook', () => {
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
    
    it.only('should process a pending webhook and return true', async () => {
      const chainId: ChainId = 80001;
      const networkData = NETWORKS[chainId];

      jest.spyOn(InitClient, 'getParams').mockResolvedValue({
        signerOrProvider: mockSigner,
        network: networkData as NetworkData,
      });

      jest
        .spyOn(EscrowClient.prototype, 'getManifestUrl')
        .mockResolvedValue(MOCK_FILE_URL);

      jest
        .spyOn(EscrowClient.prototype, 'getResultsUrl')
        .mockResolvedValue(MOCK_FILE_URL);

      const webhookEntity: Partial<WebhookIncomingEntity> = {
        id: 1,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
      };

      const recordingOracleResults: FinalResult[] = [{
        exchangeAddress: 'string',
        workerAddress: 'string',
        solution: 'string'
      }]

      const fundAmount = ethers.utils.parseUnits('10', 'ether'); // 10 ETH
      const fundAmountInWei = ethers.utils.parseUnits(
        fundAmount.toString(),
        'ether',
      );
      const totalFeePercentage = BigNumber.from(MOCK_JOB_LAUNCHER_FEE)
        .add(MOCK_RECORDING_ORACLE_FEE)
        .add(MOCK_REPUTATION_ORACLE_FEE);
      const totalFee = BigNumber.from(fundAmountInWei)
        .mul(totalFeePercentage)
        .div(100);

      const manifest: ManifestDto = {
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fee: totalFee.toString(),
        fundAmount: (10).toString(),
        mode: JobMode.DESCRIPTIVE,
        requestType: JobRequestType.FORTUNE,
      };
      const manifestUrl = MOCK_FILE_URL;

      jest.spyOn(webhookRepository, 'updateOne').mockResolvedValueOnce(webhookEntity as WebhookIncomingEntity);
      jest.spyOn(web3Service, 'getSigner').mockReturnValueOnce(mockSigner);

      jest
        .spyOn(StorageClient, 'downloadFileFromUrl')
        .mockResolvedValueOnce(manifest)
        .mockResolvedValue(recordingOracleResults);
      
      jest.spyOn(StorageClient.prototype, 'uploadFiles').mockResolvedValueOnce([{ key: MOCK_FILE_KEY, url: MOCK_FILE_URL, hash: MOCK_FILE_HASH }]);
    

      const result = await webhookService.processPendingWebhook(webhookEntity as WebhookIncomingEntity);

      expect(web3Service.getSigner).toHaveBeenCalledWith(webhookEntity.chainId);
      expect(webhookRepository.updateOne).toHaveBeenCalledWith(
        { id: webhookEntity.id },
        { 
          status: WebhookStatus.PAID, 
          resultsUrl: MOCK_FILE_KEY,
          checkPassed: true,
          retriesCount: 0
        }
      );
      expect(StorageClient.downloadFileFromUrl).toHaveBeenCalledWith(manifestUrl);
      expect(result).toBe(true);
    });
  });

  describe('processPaidWebhook', () => {
    it('should process a paid webhook and return true', async () => {
      const webhookEntity: Partial<WebhookIncomingEntity> = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        retriesCount: 0,
      };

      const finalResultsUrl = MOCK_FILE_URL;
      const finalResults = [{ workerAddress: '0x123', solution: 'result' }] as any[];
      const recordingOracleAddress = '0x789';

      jest.spyOn(web3Service, 'getSigner').mockReturnValueOnce({} as any);
      jest.spyOn(webhookRepository, 'updateOne').mockResolvedValueOnce({} as any);
      jest.spyOn(web3Service, 'getSigner').mockReturnValueOnce({} as any);
      jest.spyOn(webhookRepository, 'updateOne').mockResolvedValueOnce({} as any);
      jest.spyOn(webhookRepository, 'updateOne').mockResolvedValueOnce({} as any);
      jest.spyOn(web3Service, 'getSigner').mockReturnValueOnce({} as any);
      jest.spyOn(webhookRepository, 'updateOne').mockResolvedValueOnce({} as any);
      jest.spyOn(StorageClient, 'downloadFileFromUrl').mockResolvedValueOnce(finalResults);

      const result = await webhookService.processPaidWebhook(webhookEntity as WebhookIncomingEntity);

      expect(web3Service.getSigner).toHaveBeenCalledWith(webhookEntity.chainId);
      expect(webhookRepository.updateOne).toHaveBeenCalledWith(
        { id: webhookEntity.id },
        { status: 'COMPLETED' },
      );
      expect(webhookRepository.updateOne).toHaveBeenCalledWith(
        { id: webhookEntity.id },
        { status: 'FAILED' },
      );
      expect(StorageClient.downloadFileFromUrl).toHaveBeenCalledWith(finalResultsUrl);
      expect(result).toBe(true);
    });
  });

  describe('validateFortune', () => {
    it('should validate a fortune webhook and return true', async () => {
      const provider = new ethers.providers.JsonRpcProvider();
      let escrowClient: any, mockSigner: any;

      mockSigner = {
        ...provider.getSigner(),
        getAddress: jest.fn().mockReturnValue(ethers.constants.AddressZero),
      };
      escrowClient = new EscrowClient(await InitClient.getParams(mockSigner));
    
      const webhookEntity = {
        chainId: '123',
        escrowAddress: '0x123456789',
        retriesCount: 0,
      } as any;


      const manifestUrl = MOCK_FILE_URL;
      const manifest = { fundAmount: '100' } as any;
      const recordingOracleResultsUrl = 'http://example.com/recording-results';
      const recordingOracleResults = [{ solution: 'result' }] as any[];
      const finalResultsUrl = 'http://example.com/final-results';
      const finalResultsHash = 'hash';
      const finalResults = [{ workerAddress: '0x123', solution: 'result' }] as any[];
      const recipients = ['0x123'];
      const amounts = ['50'] as any;

      jest.spyOn(web3Service, 'getSigner').mockReturnValueOnce({} as any);
      jest.spyOn(webhookRepository, 'updateOne').mockResolvedValueOnce({} as any);
      jest.spyOn(webhookRepository, 'updateOne').mockResolvedValueOnce({} as any);
      jest.spyOn(web3Service, 'getSigner').mockReturnValueOnce({} as any);
      jest.spyOn(webhookRepository, 'updateOne').mockResolvedValueOnce({} as any);
      jest.spyOn(webhookRepository, 'updateOne').mockResolvedValueOnce({} as any);
      jest.spyOn(web3Service, 'getSigner').mockReturnValueOnce({} as any);
      jest.spyOn(webhookRepository, 'updateOne').mockResolvedValueOnce({} as any);
      jest.spyOn(StorageClient, 'downloadFileFromUrl').mockResolvedValueOnce(recordingOracleResults);
      jest.spyOn(webhookRepository, 'updateOne').mockResolvedValueOnce({} as any);
      jest.spyOn(StorageClient, 'downloadFileFromUrl').mockResolvedValueOnce(finalResults);
      jest.spyOn(StorageClient.prototype, 'uploadFiles').mockResolvedValueOnce([{ key: finalResultsUrl, url: manifestUrl, hash: finalResultsHash }]);
      jest.spyOn(escrowClient, 'storeResults').mockResolvedValueOnce(undefined);
      jest.spyOn(escrowClient, 'bulkPayOut').mockResolvedValueOnce(undefined);

      const result = await webhookService.validateFortune(webhookEntity, manifest);

      expect(web3Service.getSigner).toHaveBeenCalledWith(webhookEntity.chainId);
      expect(webhookRepository.updateOne).toHaveBeenCalledWith(
        { id: webhookEntity.id },
        {
          resultsUrl: finalResultsUrl,
          checkPassed: true,
          status: 'PAID',
          retriesCount: 0,
        },
      );
      expect(StorageClient.downloadFileFromUrl).toHaveBeenCalledWith(recordingOracleResultsUrl);
      expect(StorageClient.downloadFileFromUrl).toHaveBeenCalledWith(finalResultsUrl);
      expect(StorageClient.prototype.uploadFiles).toHaveBeenCalledWith([finalResults], 'launcher');
      expect(escrowClient.storeResults).toHaveBeenCalledWith(webhookEntity.escrowAddress, finalResultsUrl, finalResultsHash);
      expect(escrowClient.bulkPayOut).toHaveBeenCalledWith(
        webhookEntity.escrowAddress,
        recipients,
        amounts,
        finalResultsUrl,
        finalResultsHash,
      );
      expect(result).toBe(true);
    });
  });
});