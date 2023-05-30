import { Test } from '@nestjs/testing';
import { JobService } from './job.service';
import { JobRepository } from './job.repository';
import { PaymentService } from '../payment/payment.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { EthersSigner, InjectSignerProvider } from 'nestjs-ethers';
import { BigNumber } from 'ethers';
import { NotFoundException, BadGatewayException } from '@nestjs/common';

describe('JobService', () => {
  let jobService: JobService;
  let jobRepository: JobRepository;
  let paymentService: PaymentService;
  let configService: ConfigService;
  let httpService: HttpService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JobService,
        JobRepository,
        PaymentService,
        ConfigService,
        HttpService,
        {
          provide: EthersSigner,
          useValue: {},
        },
      ],
    }).compile();

    jobService = moduleRef.get<JobService>(JobService);
    jobRepository = moduleRef.get<JobRepository>(JobRepository);
    paymentService = moduleRef.get<PaymentService>(PaymentService);
    configService = moduleRef.get<ConfigService>(ConfigService);
    httpService = moduleRef.get<HttpService>(HttpService);
  });

  describe('createFortuneJob', () => {
    it('should create a fortune job successfully', async () => {
      const userId = 1;
      const dto = {
        chainId: 1,
        fortunesRequired: 5,
        requesterTitle: 'Test Job',
        requesterDescription: 'This is a test job',
        price: 1,
      };

      const userBalance = BigNumber.from('10000000000000000000'); // 10 ETH
      const amount = BigNumber.from(dto.price).mul(dto.fortunesRequired);

      jest.spyOn(paymentService, 'getUserBalance').mockResolvedValue(userBalance);
      jest.spyOn(paymentService, 'savePayment').mockResolvedValue(true);

      const result = await jobService.createFortuneJob(userId, dto);

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
      expect(paymentService.savePayment).toHaveBeenCalledWith(userId, 'BALANCE', 'WITHDRAWAL', amount);
      expect(jobRepository.create).toHaveBeenCalledWith({
        chainId: dto.chainId,
        userId,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        status: 'PENDING',
        waitUntil: expect.any(Date),
      });
      expect(result).toEqual(1);
    });

    it('should throw NotFoundException when user balance is not enough', async () => {
      const userId = 1;
      const dto = {
        chainId: 1,
        fortunesRequired: 5,
        requesterTitle: 'Test Job',
        requesterDescription: 'This is a test job',
        price: 1,
      };

      const userBalance = BigNumber.from('1000000000000000000'); // 1 ETH
      const amount = BigNumber.from(dto.price).mul(dto.fortunesRequired);

      jest.spyOn(paymentService, 'getUserBalance').mockResolvedValue(userBalance);

      await expect(jobService.createFortuneJob(userId, dto)).rejects.toThrow(NotFoundException);
      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
    });
  });

  describe('saveManifest', () => {
    it('should save the manifest file successfully', async () => {
      const encryptedManifest = { name: 'encryptedManifest' };
      const bucket = 'test-bucket';
      const uploadedFiles = [{ key: 'manifestKey', hash: 'manifestHash' }];

      jest.spyOn(configService, 'get').mockReturnValueOnce('http://127.0.0.1');
      jest.spyOn(configService, 'get').mockReturnValueOnce(9000);
      jest.spyOn(configService, 'get').mockReturnValueOnce(false);
      jest.spyOn(configService, 'get').mockReturnValueOnce('launcher');

      jest.spyOn(jobService.storageClient, 'uploadFiles').mockResolvedValue(uploadedFiles);

      const result = await jobService.saveManifest(encryptedManifest, bucket);

      expect(jobService.storageClient.uploadFiles).toHaveBeenCalledWith([encryptedManifest], bucket);
      expect(result).toEqual({ manifestUrl: expect.any(String), manifestHash: 'manifestHash' });
    });

    it('should throw BadGatewayException when unable to save the file', async () => {
      const encryptedManifest = { name: 'encryptedManifest' };
      const bucket = 'test-bucket';

      jest.spyOn(jobService.storageClient, 'uploadFiles').mockResolvedValue([]);

      await expect(jobService.saveManifest(encryptedManifest, bucket)).rejects.toThrow(BadGatewayException);
      expect(jobService.storageClient.uploadFiles).toHaveBeenCalledWith([encryptedManifest], bucket);
    });
  });

  describe('createFileUrl', () => {
    it('should create the file URL correctly with port', () => {
      const key = 'manifestKey';
      jobService.storageParams.port = 9000;

      const result = jobService.createFileUrl(key);

      expect(result).toBe('http://127.0.0.1:9000/launcher/manifestKey.json');
    });

    it('should create the file URL correctly without port', () => {
      const key = 'manifestKey';
      jobService.storageParams.port = undefined;

      const result = jobService.createFileUrl(key);

      expect(result).toBe('http://127.0.0.1/launcher/manifestKey.json');
    });
  });
});
