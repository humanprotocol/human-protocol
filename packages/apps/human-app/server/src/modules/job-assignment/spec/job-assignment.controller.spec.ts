import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { RequestWithUser } from '../../../common/interfaces/jwt';
import { JobAssignmentController } from '../job-assignment.controller';
import { JobAssignmentProfile } from '../job-assignment.mapper.profile';
import { JobAssignmentService } from '../job-assignment.service';
import {
  JobAssignmentCommand,
  JobAssignmentDto,
  JobsFetchParamsCommand,
  JobsFetchParamsDto,
  RefreshJobDto,
} from '../model/job-assignment.model';
import {
  EXCHANGE_ORACLE_ADDRESS,
  jobAssignmentCommandFixture,
  jobAssignmentDtoFixture,
  jobAssignmentResponseFixture,
  jobAssignmentToken,
  jobsFetchParamsCommandFixture,
  jobsFetchParamsDtoFixture,
  jobsFetchResponseFixture,
  refreshJobDtoFixture,
  TOKEN,
} from './job-assignment.fixtures';
import { jobAssignmentServiceMock } from './job-assignment.service.mock';
import { ForbiddenException } from '@nestjs/common';

const httpServiceMock = {
  request: jest.fn().mockImplementation((options) => {
    if (options.url.includes('processGetAssignedJobs')) {
      return Promise.resolve({ data: jobsFetchResponseFixture });
    } else if (options.url.includes('processJobAssignment')) {
      return Promise.resolve({ data: jobAssignmentResponseFixture });
    }
  }),
};

describe('JobAssignmentController', () => {
  let controller: JobAssignmentController;
  let jobAssignmentService: JobAssignmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobAssignmentController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [
        JobAssignmentService,
        JobAssignmentProfile,
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
      ],
    })
      .overrideProvider(JobAssignmentService)
      .useValue(jobAssignmentServiceMock)
      .compile();

    controller = module.get<JobAssignmentController>(JobAssignmentController);
    jobAssignmentService =
      module.get<JobAssignmentService>(JobAssignmentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('jobAssignmentDiscovery', () => {
    it('should call service processJobAssignment method with proper fields set', async () => {
      const dto: JobAssignmentDto = jobAssignmentDtoFixture;
      const command: JobAssignmentCommand = jobAssignmentCommandFixture;
      await controller.assignJob(dto, {
        token: jobAssignmentToken,
        user: { is_stake_eligible: true },
      } as RequestWithUser);
      expect(jobAssignmentService.processJobAssignment).toHaveBeenCalledWith(
        command,
      );
    });

    it('should return the result of service processJobAssignment method', async () => {
      const dto: JobAssignmentDto = jobAssignmentDtoFixture;
      const command: JobAssignmentCommand = jobAssignmentCommandFixture;
      const result = await controller.assignJob(dto, {
        token: jobAssignmentToken,
        user: { is_stake_eligible: true },
      } as RequestWithUser);
      expect(result).toEqual(
        jobAssignmentServiceMock.processJobAssignment(command),
      );
    });

    it('should throw ForbiddenException if user is not stake eligible in assignJob', async () => {
      const dto: JobAssignmentDto = jobAssignmentDtoFixture;
      await expect(
        controller.assignJob(dto, {
          token: jobAssignmentToken,
          user: { is_stake_eligible: false },
        } as RequestWithUser),
      ).rejects.toThrow(new ForbiddenException('Stake requirement not met'));
    });

    it('should call service processGetAssignedJobs method with proper fields set', async () => {
      const dto: JobsFetchParamsDto = jobsFetchParamsDtoFixture;
      const command: JobsFetchParamsCommand = jobsFetchParamsCommandFixture;
      await controller.getAssignedJobs(dto, {
        token: jobAssignmentToken,
        user: { is_stake_eligible: true },
      } as RequestWithUser);
      expect(jobAssignmentService.processGetAssignedJobs).toHaveBeenCalledWith(
        command,
      );
    });

    it('should return empty results if user is not stake eligible in getAssignedJobs', async () => {
      const dto: JobsFetchParamsDto = jobsFetchParamsDtoFixture;
      const result = await controller.getAssignedJobs(dto, {
        token: jobAssignmentToken,
        user: { is_stake_eligible: false },
      } as RequestWithUser);
      expect(result).toEqual({
        page: 0,
        page_size: 1,
        total_pages: 1,
        total_results: 0,
        results: [],
      });
    });

    it('should call service refreshAssigments method with proper fields set', async () => {
      const dto: RefreshJobDto = refreshJobDtoFixture;
      await controller.refreshAssigments(dto, {
        token: jobAssignmentToken,
        user: { is_stake_eligible: true },
      } as RequestWithUser);
      expect(jobAssignmentService.updateAssignmentsCache).toHaveBeenCalledWith({
        oracleAddress: EXCHANGE_ORACLE_ADDRESS,
        token: TOKEN,
      });
    });

    it('should throw ForbiddenException if user is not stake eligible in refreshAssigments', async () => {
      const dto: RefreshJobDto = refreshJobDtoFixture;
      await expect(
        controller.refreshAssigments(dto, {
          token: jobAssignmentToken,
          user: { is_stake_eligible: false },
        } as RequestWithUser),
      ).rejects.toThrow(new ForbiddenException('Stake requirement not met'));
    });
  });

  describe('resignAssigment', () => {
    it('should throw ForbiddenException if user is not stake eligible in resignAssigment', async () => {
      const dto = { assignment_id: '1' };
      await expect(
        controller.resignAssigment(
          dto as any,
          {
            token: jobAssignmentToken,
            user: { is_stake_eligible: false },
          } as RequestWithUser,
        ),
      ).rejects.toThrow(new ForbiddenException('Stake requirement not met'));
    });
  });
});
