import { JobAssignmentService } from '../job-assignment.service';
import { JobAssignmentController } from '../job-assignment.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { jobAssignmentServiceMock } from './job-assignment.service.mock';
import {
  JobAssignmentCommand,
  JobAssignmentDto,
  JobsFetchParamsCommand,
  JobsFetchParamsDto,
} from '../model/job-assignment.model';
import {
  jobAssignmentDtoFixture,
  jobAssignmentCommandFixture,
  jobAssignmentResponseFixture,
  jobsFetchParamsDtoFixture,
  jobsFetchParamsCommandFixture,
  jobsFetchResponseFixture,
  jobAssignmentToken,
} from './job-assignment.fixtures';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { JobAssignmentProfile } from '../job-assignment.mapper.profile';
import { HttpService } from '@nestjs/axios';

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
      await controller.assignJob(dto, jobAssignmentToken);
      expect(jobAssignmentService.processJobAssignment).toHaveBeenCalledWith(
        command,
      );
    });

    it('should return the result of service processJobAssignment method', async () => {
      const dto: JobAssignmentDto = jobAssignmentDtoFixture;
      const command: JobAssignmentCommand = jobAssignmentCommandFixture;
      const result = await controller.assignJob(dto, jobAssignmentToken);
      expect(result).toEqual(
        jobAssignmentServiceMock.processJobAssignment(command),
      );
    });

    it('should call service processGetAssignedJobs method with proper fields set', async () => {
      const dto: JobsFetchParamsDto = jobsFetchParamsDtoFixture;
      const command: JobsFetchParamsCommand = jobsFetchParamsCommandFixture;
      await controller.getAssignedJobs(dto, jobAssignmentToken);
      expect(jobAssignmentService.processGetAssignedJobs).toHaveBeenCalledWith(
        command,
      );
    });
  });
});
