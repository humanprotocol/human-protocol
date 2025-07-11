import { Test, TestingModule } from '@nestjs/testing';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import {
  BadRequestException,
  ConflictException,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { MUTEX_TIMEOUT } from '../../common/constants';
import { MutexManagerService } from '../mutex/mutex-manager.service';
import { RequestWithUser } from '../../common/types';
import { JwtAuthGuard } from '../../common/guards';
import { JobCvatDto, JobFortuneDto, JobQuickLaunchDto } from './job.dto';
import {
  CvatJobType,
  EscrowFundToken,
  FortuneJobType,
  JobRequestType,
} from '../../common/enums/job';
import {
  MOCK_FILE_HASH,
  MOCK_FILE_URL,
  MOCK_REQUESTER_DESCRIPTION,
  MOCK_REQUESTER_TITLE,
} from '../../../test/constants';
import { AWSRegions, StorageProviders } from '../../common/enums/storage';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ConfigService } from '@nestjs/config';
import { PaymentCurrency } from '../../common/enums/payment';

describe('JobController', () => {
  let jobController: JobController;

  const mockJobService = {
    createJob: jest.fn(),
  };

  const mockMutexManagerService = {
    runExclusive: jest.fn(),
  };

  const mockRequest: RequestWithUser = {
    user: { id: 1 },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobController],
      providers: [
        {
          provide: JobService,
          useValue: mockJobService,
        },
        {
          provide: MutexManagerService,
          useValue: mockMutexManagerService,
        },
        Web3ConfigService,
        ConfigService,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockRequest.user;
          return true;
        },
      })
      .compile();

    jobController = module.get<JobController>(JobController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(jobController).toBeDefined();
  });

  describe('quickLaunch', () => {
    it('should create a job and return job ID', async () => {
      const jobDto: JobQuickLaunchDto = {
        requestType: 'type_a' as JobRequestType,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        paymentCurrency: PaymentCurrency.USD,
        paymentAmount: 500,
        escrowFundToken: EscrowFundToken.HMT,
      };

      mockMutexManagerService.runExclusive.mockImplementationOnce(
        async (_id, _timeout, fn) => {
          return await fn();
        },
      );

      mockJobService.createJob.mockResolvedValueOnce(1);

      const result = await jobController.quickLaunch(jobDto, mockRequest);

      expect(mockJobService.createJob).toHaveBeenCalledWith(
        mockRequest.user,
        jobDto.requestType,
        jobDto,
      );

      expect(result).toBe(1);

      expect(mockMutexManagerService.runExclusive).toHaveBeenCalledWith(
        `user${mockRequest.user.id}`,
        MUTEX_TIMEOUT,
        expect.any(Function),
      );
    });

    it('should throw a conflict error if mutex manager fails', async () => {
      const jobDto: JobQuickLaunchDto = {
        requestType: 'type_a' as JobRequestType,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        paymentCurrency: PaymentCurrency.USD,
        paymentAmount: 500,
        escrowFundToken: EscrowFundToken.HMT,
      };

      mockMutexManagerService.runExclusive.mockRejectedValueOnce(
        new Error('Conflict'),
      );

      await expect(
        jobController.quickLaunch(jobDto, mockRequest),
      ).rejects.toThrow('Conflict');
      expect(mockJobService.createJob).not.toHaveBeenCalled();
    });

    it('should return validation error for invalid input', async () => {
      const invalidJobDto: any = {
        requestType: '', // Invalid input
        manifestUrl: '',
        manifestHash: '',
        paymentCurrency: PaymentCurrency.USD,
        paymentAmount: 500,
        escrowFundToken: EscrowFundToken.HMT,
      };

      mockMutexManagerService.runExclusive.mockRejectedValueOnce(
        new Error('Bad Request'),
      );

      await expect(
        jobController.quickLaunch(invalidJobDto, mockRequest),
      ).rejects.toThrow('Bad Request');
      expect(mockJobService.createJob).not.toHaveBeenCalled();
    });

    it('should return unauthorized error if user is not authenticated', async () => {
      const jobDto: JobQuickLaunchDto = {
        requestType: 'type_a' as JobRequestType,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        paymentCurrency: PaymentCurrency.USD,
        paymentAmount: 500,
        escrowFundToken: EscrowFundToken.HMT,
      };

      mockMutexManagerService.runExclusive.mockRejectedValueOnce(
        new UnauthorizedException('Unauthorized'),
      );

      await expect(
        jobController.quickLaunch(jobDto, mockRequest),
      ).rejects.toThrow('Unauthorized');

      expect(mockMutexManagerService.runExclusive).toHaveBeenCalledWith(
        `user${mockRequest.user.id}`,
        MUTEX_TIMEOUT,
        expect.any(Function),
      );
    });
  });

  describe('createFortuneJob', () => {
    const jobFortuneDto: JobFortuneDto = {
      requesterTitle: MOCK_REQUESTER_TITLE,
      requesterDescription: MOCK_REQUESTER_DESCRIPTION,
      submissionsRequired: 10,
      paymentCurrency: PaymentCurrency.HMT,
      paymentAmount: 500,
      escrowFundToken: EscrowFundToken.HMT,
    };

    it('should create a fortune job successfully', async () => {
      mockJobService.createJob.mockResolvedValue(1);
      mockMutexManagerService.runExclusive.mockImplementation(
        async (_lock, _timeout, fn) => await fn(),
      );

      const result = await jobController.createFortuneJob(
        jobFortuneDto,
        mockRequest,
      );

      expect(result).toBe(1);
      expect(mockMutexManagerService.runExclusive).toHaveBeenCalledWith(
        `user${mockRequest.user.id}`,
        expect.any(Number),
        expect.any(Function),
      );
      expect(mockJobService.createJob).toHaveBeenCalledWith(
        mockRequest.user,
        FortuneJobType.FORTUNE,
        jobFortuneDto,
      );
    });

    it('should throw UnauthorizedException if user is not authorized', async () => {
      mockMutexManagerService.runExclusive.mockRejectedValueOnce(
        new UnauthorizedException(),
      );

      await expect(
        jobController.createFortuneJob(jobFortuneDto, mockRequest),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockMutexManagerService.runExclusive).toHaveBeenCalledWith(
        `user${mockRequest.user.id}`,
        expect.any(Number),
        expect.any(Function),
      );
      expect(mockJobService.createJob).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if there is a conflict', async () => {
      mockMutexManagerService.runExclusive.mockRejectedValueOnce(
        new ConflictException(),
      );

      await expect(
        jobController.createFortuneJob(jobFortuneDto, mockRequest),
      ).rejects.toThrow(ConflictException);

      expect(mockMutexManagerService.runExclusive).toHaveBeenCalledWith(
        `user${mockRequest.user.id}`,
        expect.any(Number),
        expect.any(Function),
      );
      expect(mockJobService.createJob).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid input', async () => {
      mockMutexManagerService.runExclusive.mockRejectedValueOnce(
        new BadRequestException(),
      );

      await expect(
        jobController.createFortuneJob(jobFortuneDto, mockRequest),
      ).rejects.toThrow(BadRequestException);

      expect(mockMutexManagerService.runExclusive).toHaveBeenCalledWith(
        `user${mockRequest.user.id}`,
        expect.any(Number),
        expect.any(Function),
      );
      expect(mockJobService.createJob).not.toHaveBeenCalled();
    });
  });

  describe('createCvatJob', () => {
    const jobCvatDto: JobCvatDto = {
      requesterDescription: 'Sample description',
      data: {
        dataset: {
          provider: 'AWS' as StorageProviders,
          region: 'us-east-1' as AWSRegions,
          bucketName: 'sample-bucket',
          path: 'path/to/dataset',
        },
      },
      labels: [
        {
          name: 'Label 1',
          nodes: ['node1', 'node2'],
        },
      ],
      minQuality: 90,
      groundTruth: {
        provider: 'AWS' as StorageProviders,
        region: 'us-west-1' as AWSRegions,
        bucketName: 'ground-truth-bucket',
        path: 'path/to/groundtruth',
      },
      userGuide: 'https://example.com/user-guide',
      type: CvatJobType.IMAGE_BOXES,
      paymentCurrency: PaymentCurrency.HMT,
      paymentAmount: 500,
      escrowFundToken: EscrowFundToken.HMT,
    };

    it('should create a CVAT job successfully', async () => {
      mockJobService.createJob.mockResolvedValue(1);
      mockMutexManagerService.runExclusive.mockImplementation(
        async (_lock, _timeout, fn) => await fn(),
      );

      const result = await jobController.createCvatJob(jobCvatDto, mockRequest);

      expect(result).toBe(1);
      expect(mockMutexManagerService.runExclusive).toHaveBeenCalledWith(
        `user${mockRequest.user.id}`,
        expect.any(Number),
        expect.any(Function),
      );
      expect(mockJobService.createJob).toHaveBeenCalledWith(
        mockRequest.user,
        CvatJobType.IMAGE_BOXES,
        jobCvatDto,
      );
    });

    it('should throw UnauthorizedException if user is not authorized', async () => {
      mockMutexManagerService.runExclusive.mockRejectedValueOnce(
        new UnauthorizedException(),
      );

      await expect(
        jobController.createCvatJob(jobCvatDto, mockRequest),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockMutexManagerService.runExclusive).toHaveBeenCalledWith(
        `user${mockRequest.user.id}`,
        expect.any(Number),
        expect.any(Function),
      );
      expect(mockJobService.createJob).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if there is a conflict', async () => {
      mockMutexManagerService.runExclusive.mockRejectedValueOnce(
        new ConflictException(),
      );

      await expect(
        jobController.createCvatJob(jobCvatDto, mockRequest),
      ).rejects.toThrow(ConflictException);

      expect(mockMutexManagerService.runExclusive).toHaveBeenCalledWith(
        `user${mockRequest.user.id}`,
        expect.any(Number),
        expect.any(Function),
      );
      expect(mockJobService.createJob).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid input', async () => {
      mockMutexManagerService.runExclusive.mockRejectedValueOnce(
        new BadRequestException(),
      );

      await expect(
        jobController.createCvatJob(jobCvatDto, mockRequest),
      ).rejects.toThrow(BadRequestException);

      expect(mockMutexManagerService.runExclusive).toHaveBeenCalledWith(
        `user${mockRequest.user.id}`,
        expect.any(Number),
        expect.any(Function),
      );
      expect(mockJobService.createJob).not.toHaveBeenCalled();
    });
  });
});
