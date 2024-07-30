import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MOCK_ADDRESS, MOCK_PRIVATE_KEY } from '../../../test/constants';
import { TOKEN } from '../../common/constant';
import { AssignmentStatus, JobType } from '../../common/enums/job';
import { AssignmentRepository } from '../assignment/assignment.repository';
import { AssignmentService } from '../assignment/assignment.service';
import { ManifestDto } from '../job/job.dto';
import { JobRepository } from '../job/job.repository';
import { JobService } from '../job/job.service';
import { Web3Service } from '../web3/web3.service';
import { AssignmentDto, CreateAssignmentDto } from './assignment.dto';
import { Escrow__factory } from '@human-protocol/core/typechain-types';
import { AssignmentSortField } from '../../common/enums/job';
import { SortDirection } from '../../common/enums/collection';
import { AssignmentEntity } from './assignment.entity';
import { ErrorAssignment } from '../../common/constant/errors';
import { BadRequestException } from '@nestjs/common';
import { ServerConfigService } from '../../common/config/server-config.service';

jest.mock('@human-protocol/core/typechain-types', () => ({
  ...jest.requireActual('@human-protocol/core/typechain-types'),
  Escrow__factory: {
    connect: jest.fn(),
  },
}));

describe('AssignmentService', () => {
  let assignmentService: AssignmentService;
  let assignmentRepository: AssignmentRepository;
  let jobRepository: JobRepository;
  let jobService: JobService;

  const chainId = 1;
  const escrowAddress = '0x1234567890123456789012345678901234567890';
  const workerAddress = '0x1234567890123456789012345678901234567891';
  const reputationNetwork = '0x1234567890123456789012345678901234567892';

  const signerMock = {
    address: '0x1234567890123456789012345678901234567892',
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  const configServiceMock: Partial<ConfigService> = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'WEB3_PRIVATE_KEY':
          return MOCK_PRIVATE_KEY;
      }
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [],
      providers: [
        AssignmentService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        { provide: JobRepository, useValue: createMock<JobRepository>() },
        { provide: JobService, useValue: createMock<JobService>() },
        {
          provide: AssignmentRepository,
          useValue: {
            fetchFiltered: jest.fn(),
            createUnique: jest.fn(),
            findOneByJobIdAndWorker: jest.fn(),
            countByJobId: jest.fn(),
            findOneById: jest.fn(),
            updateOne: jest.fn(),
          },
        },
        ServerConfigService,
      ],
    }).compile();

    assignmentService = moduleRef.get<AssignmentService>(AssignmentService);
    jobService = moduleRef.get<JobService>(JobService);
    jobRepository = moduleRef.get<JobRepository>(JobRepository);
    assignmentRepository =
      moduleRef.get<AssignmentRepository>(AssignmentRepository);
  });

  describe('createAssignment', () => {
    const manifest: ManifestDto = {
      requesterTitle: 'Example Title',
      requesterDescription: 'Example Description',
      submissionsRequired: 5,
      fundAmount: 100,
    };

    beforeAll(async () => {
      jest.spyOn(jobRepository, 'createUnique');
    });
    const createAssignmentDto: CreateAssignmentDto = {
      chainId,
      escrowAddress,
    };

    it('should create a new assignment in the database', async () => {
      jest
        .spyOn(jobRepository, 'findOneByChainIdAndEscrowAddress')
        .mockResolvedValue({
          id: 1,
          reputationNetwork: reputationNetwork,
        } as any);
      jest
        .spyOn(assignmentRepository, 'findOneByJobIdAndWorker')
        .mockResolvedValue(null);
      jest.spyOn(assignmentRepository, 'countByJobId').mockResolvedValue(0);
      jest.spyOn(jobService, 'getManifest').mockResolvedValue(manifest);
      (Escrow__factory.connect as any).mockImplementation(() => ({
        duration: jest
          .fn()
          .mockResolvedValue((new Date().getTime() + 1000) / 1000),
      }));

      const result = await assignmentService.createAssignment(
        createAssignmentDto,
        { address: workerAddress, reputationNetwork: reputationNetwork } as any,
      );

      expect(result).toEqual(undefined);
      expect(assignmentRepository.createUnique).toHaveBeenCalledWith({
        job: { id: 1, reputationNetwork: reputationNetwork },
        workerAddress: workerAddress,
        status: AssignmentStatus.ACTIVE,
        expiresAt: expect.any(Date),
        rewardAmount: manifest.fundAmount / manifest.submissionsRequired,
      });
      expect(jobService.getManifest).toHaveBeenCalledWith(
        chainId,
        escrowAddress,
      );
    });

    it('should fail if escrow address is invalid', async () => {
      jest
        .spyOn(jobRepository, 'findOneByChainIdAndEscrowAddress')
        .mockResolvedValue(null);

      await expect(
        assignmentService.createAssignment(createAssignmentDto, {
          address: workerAddress,
          reputationNetwork: reputationNetwork,
        } as any),
      ).rejects.toThrow('Job not found');
    });

    it('should fail if job is not in the same reputation network', async () => {
      const differentReputationNetwork =
        '0x1234567890123456789012345678901234567893';
      jest
        .spyOn(jobRepository, 'findOneByChainIdAndEscrowAddress')
        .mockResolvedValue({
          id: 1,
          reputationNetwork: differentReputationNetwork,
        } as any);

      await expect(
        assignmentService.createAssignment(createAssignmentDto, {
          address: workerAddress,
          reputationNetwork: reputationNetwork,
        } as any),
      ).rejects.toThrow('Requested job is not in your reputation network');
    });

    it('should fail if user already assigned', async () => {
      jest
        .spyOn(jobRepository, 'findOneByChainIdAndEscrowAddress')
        .mockResolvedValue({
          id: 1,
          reputationNetwork: reputationNetwork,
        } as any);
      jest
        .spyOn(assignmentRepository, 'findOneByJobIdAndWorker')
        .mockResolvedValue({ id: 1 } as any);

      await expect(
        assignmentService.createAssignment(createAssignmentDto, {
          address: workerAddress,
          reputationNetwork: reputationNetwork,
        } as any),
      ).rejects.toThrow('Assignment already exists');
    });

    it('should fail if job is fully assigned', async () => {
      jest
        .spyOn(jobRepository, 'findOneByChainIdAndEscrowAddress')
        .mockResolvedValue({
          id: 1,
          reputationNetwork: reputationNetwork,
        } as any);
      jest
        .spyOn(assignmentRepository, 'findOneByJobIdAndWorker')
        .mockResolvedValue(null);
      jest.spyOn(assignmentRepository, 'countByJobId').mockResolvedValue(5);
      jest.spyOn(jobService, 'getManifest').mockResolvedValue(manifest);

      await expect(
        assignmentService.createAssignment(createAssignmentDto, {
          address: workerAddress,
          reputationNetwork: reputationNetwork,
        } as any),
      ).rejects.toThrow('Fully assigned job');
    });

    it('should fail if job is expired', async () => {
      jest
        .spyOn(jobRepository, 'findOneByChainIdAndEscrowAddress')
        .mockResolvedValue({
          id: 1,
          reputationNetwork: reputationNetwork,
        } as any);
      jest
        .spyOn(assignmentRepository, 'findOneByJobIdAndWorker')
        .mockResolvedValue(null);
      jest.spyOn(assignmentRepository, 'countByJobId').mockResolvedValue(0);
      jest.spyOn(jobService, 'getManifest').mockResolvedValue(manifest);
      (Escrow__factory.connect as any).mockImplementation(() => ({
        duration: jest
          .fn()
          .mockResolvedValue((new Date().getTime() - 1000) / 1000),
      }));

      await expect(
        assignmentService.createAssignment(createAssignmentDto, {
          address: workerAddress,
          reputationNetwork: reputationNetwork,
        } as any),
      ).rejects.toThrow('Expired escrow');
    });
  });

  describe('getAssignmentList', () => {
    const assignments = [
      {
        id: 1,
        job: {
          chainId: 1,
          escrowAddress,
        },
        status: AssignmentStatus.ACTIVE,
        createdAt: new Date(),
        expiresAt: new Date(),
        rewardAmount: 20,
      },
    ];

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return an array of assignments', async () => {
      const manifest: ManifestDto = {
        requesterTitle: 'Example Title',
        requesterDescription: 'Example Description',
        submissionsRequired: 5,
        fundAmount: 100,
      };

      jest.spyOn(jobService, 'getManifest').mockResolvedValue(manifest);
      jest
        .spyOn(assignmentRepository, 'fetchFiltered')
        .mockResolvedValueOnce({ entities: assignments as any, itemCount: 1 });

      const result = await assignmentService.getAssignmentList(
        {
          chainId,
          jobType: JobType.FORTUNE,
          escrowAddress,
          status: AssignmentStatus.ACTIVE,
          page: 0,
          pageSize: 10,
          skip: 0,
          sortField: AssignmentSortField.CREATED_AT,
          sort: SortDirection.ASC,
        },
        workerAddress,
        reputationNetwork,
      );

      expect(result.totalResults).toEqual(1);
      expect(result.results[0]).toEqual({
        assignmentId: '1',
        chainId: 1,
        escrowAddress: escrowAddress,
        jobType: JobType.FORTUNE,
        status: AssignmentStatus.ACTIVE,
        rewardToken: TOKEN,
        rewardAmount: 20,
        url: expect.any(String),
        createdAt: expect.any(String),
        expiresAt: expect.any(String),
      } as AssignmentDto);
      expect(jobService.getManifest).toHaveBeenCalledWith(
        chainId,
        escrowAddress,
      );
      expect(assignmentRepository.fetchFiltered).toHaveBeenCalledWith({
        page: 0,
        pageSize: 10,
        skip: 0,
        sort: SortDirection.ASC,
        sortField: AssignmentSortField.CREATED_AT,
        chainId,
        jobType: JobType.FORTUNE,
        escrowAddress,
        status: AssignmentStatus.ACTIVE,
        reputationNetwork,
        workerAddress,
      });
    });

    it('should return an empty array if no assignments are found', async () => {
      jest
        .spyOn(assignmentRepository, 'fetchFiltered')
        .mockResolvedValueOnce({ entities: [], itemCount: 0 });

      const result = await assignmentService.getAssignmentList(
        {
          chainId,
          jobType: JobType.FORTUNE,
          escrowAddress,
          status: AssignmentStatus.ACTIVE,
          page: 1,
          pageSize: 10,
          skip: 0,
          sortField: AssignmentSortField.CREATED_AT,
          sort: SortDirection.ASC,
        },
        workerAddress,
        reputationNetwork,
      );

      expect(result.totalResults).toEqual(0);
      expect(result.results).toEqual([]);
    });

    it('should handle different sort orders correctly', async () => {
      jest
        .spyOn(assignmentRepository, 'fetchFiltered')
        .mockResolvedValueOnce({ entities: assignments as any, itemCount: 1 });

      await assignmentService.getAssignmentList(
        {
          chainId,
          jobType: JobType.FORTUNE,
          escrowAddress,
          status: AssignmentStatus.ACTIVE,
          page: 1,
          pageSize: 10,
          skip: 0,
          sortField: AssignmentSortField.CREATED_AT,
          sort: SortDirection.DESC,
        },
        workerAddress,
        reputationNetwork,
      );

      expect(assignmentRepository.fetchFiltered).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        skip: 0,
        sort: SortDirection.DESC,
        sortField: AssignmentSortField.CREATED_AT,
        chainId,
        jobType: JobType.FORTUNE,
        escrowAddress,
        status: AssignmentStatus.ACTIVE,
        reputationNetwork,
        workerAddress,
      });
    });
  });

  describe('resignJob', () => {
    it('should successfully cancel an active assignment', async () => {
      const assignmentId = 1;
      const workerAddress = MOCK_ADDRESS;
      const mockAssignment = {
        id: assignmentId,
        workerAddress,
        status: AssignmentStatus.ACTIVE,
      } as AssignmentEntity;

      jest
        .spyOn(assignmentRepository, 'findOneById')
        .mockResolvedValue(mockAssignment);

      await expect(
        assignmentService.resign(assignmentId, workerAddress),
      ).resolves.toBeUndefined();
      expect(mockAssignment.status).toBe(AssignmentStatus.CANCELED);
      expect(assignmentRepository.updateOne).toHaveBeenCalledWith(
        mockAssignment,
      );
    });

    it('should throw NotFound if assignment does not exist', async () => {
      const assignmentId = 1;
      const workerAddress = MOCK_ADDRESS;

      jest.spyOn(assignmentRepository, 'findOneById').mockResolvedValue(null);

      await expect(
        assignmentService.resign(assignmentId, workerAddress),
      ).rejects.toThrow(new BadRequestException(ErrorAssignment.NotFound));
    });

    it('should throw InvalidStatus if assignment status is not ACTIVE', async () => {
      const assignmentId = 1;
      const workerAddress = MOCK_ADDRESS;
      const mockAssignment = {
        id: assignmentId,
        workerAddress,
        status: AssignmentStatus.COMPLETED,
      } as AssignmentEntity;

      jest
        .spyOn(assignmentRepository, 'findOneById')
        .mockResolvedValue(mockAssignment);

      await expect(
        assignmentService.resign(assignmentId, workerAddress),
      ).rejects.toThrow(new BadRequestException(ErrorAssignment.InvalidStatus));
    });
  });
});
