import { Test } from '@nestjs/testing';
import { JobService } from './job.service';
import { JobRepository } from './job.repository';
import { PaymentService } from '../payment/payment.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BigNumber } from 'ethers';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { StorageClient } from '@human-protocol/sdk';
import { PaymentSource, PaymentType } from '../../common/enums/payment';
import { JobStatus } from '../../common/enums/job';
import { JOB_LAUNCHER_FEE, RECORDING_ORACLE_FEE, REPUTATION_ORACLE_FEE } from '../../common/constants';

jest.mock('@human-protocol/sdk');

describe('JobService', () => {
  let jobService: JobService;
  let jobRepository: DeepMocked<JobRepository>;
  let paymentService: DeepMocked<PaymentService>;
  let configService: DeepMocked<ConfigService>;
  let httpService: DeepMocked<HttpService>;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JobService,
        { provide: JobRepository, useValue: createMock<JobRepository>() },
        { provide: PaymentService, useValue: createMock<PaymentService>() },
        { provide: ConfigService, useValue: createMock<ConfigService>() },
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
        .mockResolvedValue([{ key: 'manifest.json', hash: 'hash' }]);
      jest.spyOn(jobService, 'createFileUrl').mockReturnValue('mockedFileUrl');
      const userId = 1;
      const dto = {
        chainId: 1,
        fortunesRequired: 5,
        requesterTitle: 'Test Job',
        requesterDescription: 'This is a test job',
        fundAmount: 1,
      };

      const userBalance = BigNumber.from('10000000000000000000'); // 10 ETH

      const totalFeePercentage = BigNumber.from(JOB_LAUNCHER_FEE)
        .add(RECORDING_ORACLE_FEE)
        .add(REPUTATION_ORACLE_FEE);

      const totalFee = BigNumber.from(dto.fundAmount)
        .mul(totalFeePercentage)
        .div(100);
      const totalAmount = BigNumber.from(dto.fundAmount).add(totalFee);

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

    // it('should throw NotFoundException when user balance is not enough', async () => {
    //   const userId = 1;
    //   const dto = {
    //     chainId: 1,
    //     fortunesRequired: 5,
    //     requesterTitle: 'Test Job',
    //     requesterDescription: 'This is a test job',
    //     fundAmount: 1,
    //   };

    //   const userBalance = BigNumber.from('1000000000000000000'); // 1 ETH
    //   const amount = BigNumber.from(dto.fundAmount).mul(dto.fortunesRequired);

    //   jest
    //     .spyOn(paymentService, 'getUserBalance')
    //     .mockResolvedValue(userBalance);

    //   await expect(jobService.createFortuneJob(userId, dto)).rejects.toThrow(
    //     NotFoundException,
    //   );
    //   expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
    // });
  });

  // describe('saveManifest', () => {
  //   it('should save the manifest file successfully', async () => {
  //     const encryptedManifest = { name: 'encryptedManifest' };
  //     const bucket = 'test-bucket';
  //     const uploadedFiles = [{ key: 'manifestKey', hash: 'manifestHash' }];

  //     jest.spyOn(configService, 'get').mockReturnValueOnce('http://127.0.0.1');
  //     jest.spyOn(configService, 'get').mockReturnValueOnce(9000);
  //     jest.spyOn(configService, 'get').mockReturnValueOnce(false);
  //     jest.spyOn(configService, 'get').mockReturnValueOnce('launcher');

  //     jest
  //       .spyOn(jobService.storageClient, 'uploadFiles')
  //       .mockResolvedValue(uploadedFiles);

  //     const result = await jobService.saveManifest(encryptedManifest, bucket);

  //     expect(jobService.storageClient.uploadFiles).toHaveBeenCalledWith(
  //       [encryptedManifest],
  //       bucket,
  //     );
  //     expect(result).toEqual({
  //       manifestUrl: expect.any(String),
  //       manifestHash: 'manifestHash',
  //     });
  //   });

  //   it('should throw BadGatewayException when unable to save the file', async () => {
  //     const encryptedManifest = { name: 'encryptedManifest' };
  //     const bucket = 'test-bucket';

  //     jest.spyOn(jobService.storageClient, 'uploadFiles').mockResolvedValue([]);

  //     await expect(
  //       jobService.saveManifest(encryptedManifest, bucket),
  //     ).rejects.toThrow(BadGatewayException);
  //     expect(jobService.storageClient.uploadFiles).toHaveBeenCalledWith(
  //       [encryptedManifest],
  //       bucket,
  //     );
  //   });
  // });

  // describe('createFileUrl', () => {
  //   it('should create the file URL correctly with port', () => {
  //     const key = 'manifestKey';
  //     jobService.storageParams.port = 9000;

  //     const result = jobService.createFileUrl(key);

  //     expect(result).toBe('http://127.0.0.1:9000/launcher/manifestKey.json');
  //   });

  //   it('should create the file URL correctly without port', () => {
  //     const key = 'manifestKey';
  //     jobService.storageParams.port = undefined;

  //     const result = jobService.createFileUrl(key);

  //     expect(result).toBe('http://127.0.0.1/launcher/manifestKey.json');
  //   });
  // });
});
