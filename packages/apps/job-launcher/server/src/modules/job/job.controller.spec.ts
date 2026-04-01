import { faker } from '@faker-js/faker/.';
import {
  BadRequestException,
  ConflictException,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MUTEX_TIMEOUT } from '../../common/constants';
import {
  CvatJobType,
  EscrowFundToken,
  FortuneJobType,
  JobRequestType,
} from '../../common/enums/job';
import { PaymentCurrency } from '../../common/enums/payment';
import { JwtAuthGuard } from '../../common/guards';
import { RequestWithUser } from '../../common/types';
import {
  createMockCvatManifest,
  createMockFortuneManifest,
} from '../manifest/fixtures';
import { MutexManagerService } from '../mutex/mutex-manager.service';
import { JobController } from './job.controller';
import { JobManifestDto, JobQuickLaunchDto } from './job.dto';
import { JobService } from './job.service';

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
        manifestUrl: faker.internet.url(),
        manifestHash: faker.string.uuid(),
        paymentCurrency: PaymentCurrency.USD,
        paymentAmount: faker.number.int({ min: 100, max: 1000 }),
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
        manifestUrl: faker.internet.url(),
        manifestHash: faker.string.uuid(),
        paymentCurrency: faker.helpers.arrayElement(
          Object.values(PaymentCurrency),
        ),
        paymentAmount: faker.number.int({ min: 100, max: 1000 }),
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
        paymentCurrency: faker.helpers.arrayElement(
          Object.values(PaymentCurrency),
        ),
        paymentAmount: faker.number.int({ min: 100, max: 1000 }),
        escrowFundToken: faker.helpers.arrayElement(
          Object.values(EscrowFundToken),
        ),
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
        manifestUrl: faker.internet.url(),
        manifestHash: faker.string.uuid(),
        paymentCurrency: faker.helpers.arrayElement(
          Object.values(PaymentCurrency),
        ),
        paymentAmount: faker.number.int({ min: 100, max: 1000 }),
        escrowFundToken: faker.helpers.arrayElement(
          Object.values(EscrowFundToken),
        ),
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

  describe('createJob', () => {
    const jobManifestDto: JobManifestDto = {
      requestType: FortuneJobType.FORTUNE,
      manifest: createMockFortuneManifest({
        requesterTitle: faker.string.sample(),
        requesterDescription: faker.string.sample(),
        submissionsRequired: faker.number.int({ min: 1, max: 10 }),
      }),
      paymentCurrency: faker.helpers.arrayElement(
        Object.values(PaymentCurrency),
      ),
      paymentAmount: faker.number.int({ min: 100, max: 1000 }),
      escrowFundToken: faker.helpers.arrayElement(
        Object.values(EscrowFundToken),
      ),
    };

    it('should create a job successfully', async () => {
      mockJobService.createJob.mockResolvedValue(1);
      mockMutexManagerService.runExclusive.mockImplementation(
        async (_lock, _timeout, fn) => await fn(),
      );

      const result = await jobController.createJob(jobManifestDto, mockRequest);

      expect(result).toBe(1);
      expect(mockMutexManagerService.runExclusive).toHaveBeenCalledWith(
        `user${mockRequest.user.id}`,
        expect.any(Number),
        expect.any(Function),
      );
      expect(mockJobService.createJob).toHaveBeenCalledWith(
        mockRequest.user,
        jobManifestDto.requestType,
        jobManifestDto,
      );
    });

    it('should create a CVAT job successfully', async () => {
      const cvatManifest = createMockCvatManifest();
      cvatManifest.annotation.type = CvatJobType.IMAGE_BOXES;

      const cvatJobManifestDto: JobManifestDto = {
        requestType: CvatJobType.IMAGE_BOXES,
        manifest: cvatManifest,
        paymentCurrency: faker.helpers.arrayElement(
          Object.values(PaymentCurrency),
        ),
        paymentAmount: faker.number.int({ min: 100, max: 1000 }),
        escrowFundToken: faker.helpers.arrayElement(
          Object.values(EscrowFundToken),
        ),
      };

      mockJobService.createJob.mockResolvedValue(2);
      mockMutexManagerService.runExclusive.mockImplementation(
        async (_lock, _timeout, fn) => await fn(),
      );

      const result = await jobController.createJob(
        cvatJobManifestDto,
        mockRequest,
      );

      expect(result).toBe(2);
      expect(mockJobService.createJob).toHaveBeenCalledWith(
        mockRequest.user,
        cvatJobManifestDto.requestType,
        cvatJobManifestDto,
      );
    });

    it('should throw UnauthorizedException if user is not authorized', async () => {
      mockMutexManagerService.runExclusive.mockRejectedValueOnce(
        new UnauthorizedException(),
      );

      await expect(
        jobController.createJob(jobManifestDto, mockRequest),
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
        jobController.createJob(jobManifestDto, mockRequest),
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
        jobController.createJob(jobManifestDto, mockRequest),
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
