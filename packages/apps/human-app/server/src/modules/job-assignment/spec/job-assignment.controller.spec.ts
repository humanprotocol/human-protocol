import { JobAssignmentService } from '../job-assignment.service';
import { JobAssignmentController } from '../job-assignment.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { jobAssignmentServiceMock } from './job-assignment.service.mock';
import {
  JobAssignmentCommand,
  JobAssignmentDto,
  JobsAssignmentParamsCommand,
  JobsAssignmentParamsDto,
} from '../interfaces/job-assignment.interface';
import {
  jobAssignmentDtoFixture,
  jobAssignmentCommandFixture,
  jobAssignmentDataFixture,
  jobAssignmentResponseFixture,
  jobsAssignmentParamsDtoFixture,
  jobsAssignmentParamsCommandFixture,
  jobsAssignmentParamsDataFixture,
  jobsAssignmentResponseItemFixture,
  jobsAssignmentResponseFixture,
} from './job-assignment.fixtures';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { JobAssignmentProfile } from '../job-assignment.mapper';
import { HttpService } from '@nestjs/axios';

const httpServiceMock = {
  request: jest.fn().mockImplementation((options) => {
    if (options.url.includes('processGettingAssignedJobs')) {
      return Promise.resolve({ data: jobsAssignmentResponseFixture });
    } else if (options.url.includes('processJobAssignment')) {
      return Promise.resolve({ data: jobAssignmentResponseFixture });
    }
  }),
};

describe('JobAssignmentController', () => {
  let controller: JobAssignmentController;
  let jobAssignmentService: JobAssignmentService;
  let httpService: HttpService;

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
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('jobAssignmentDiscovery', () => {
    it('should call service processJobAssignment method with proper fields set', async () => {
      const url = 'url';
      const dto: JobAssignmentDto = jobAssignmentDtoFixture;
      const command: JobAssignmentCommand = jobAssignmentCommandFixture;
      await controller.assignJob(url, dto);
      expect(jobAssignmentService.processJobAssignment).toHaveBeenCalledWith(
        url,
        command,
      );
    });

    it('should return the result of service processJobAssignment method', async () => {
      const url = 'url';
      const dto: JobAssignmentDto = jobAssignmentDtoFixture;
      const command: JobAssignmentCommand = jobAssignmentCommandFixture;
      const result = await controller.assignJob(url, dto);
      expect(result).toEqual(
        jobAssignmentServiceMock.processJobAssignment(url, command),
      );
    });

    it('should call service processGettingAssignedJobs method with proper fields set', async () => {
      const url = 'url';
      const dto: JobsAssignmentParamsDto = jobsAssignmentParamsDtoFixture;
      const command: JobsAssignmentParamsCommand =
        jobsAssignmentParamsCommandFixture;
      await controller.getAssignedJobs(url, dto);
      expect(
        jobAssignmentService.processGettingAssignedJobs,
      ).toHaveBeenCalledWith(url, command);
    });

    it('should return the result of service processGettingAssignedJobs method', async () => {
      const url = 'url';
      const dto: JobsAssignmentParamsDto = jobsAssignmentParamsDtoFixture;
      const command: JobsAssignmentParamsCommand =
        jobsAssignmentParamsCommandFixture;
      const result = await controller.getAssignedJobs(url, dto);
      expect(result).toEqual(
        jobAssignmentServiceMock.processGettingAssignedJobs(url, command),
      );
    });
  });
});
