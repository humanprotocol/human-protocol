import { JobsDiscoveryService } from '../jobs-discovery.service';
import { JobsDiscoveryController } from '../jobs-discovery.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { jobsDiscoveryServiceMock } from './jobs-discovery.service.mock';
import {
  jobsDiscoveryParamsCommandFixture,
  dtoFixture,
  jobDiscoveryToken,
  responseFixture,
} from './jobs-discovery.fixtures';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { JobsDiscoveryProfile } from '../jobs-discovery.mapper';
import { HttpService } from '@nestjs/axios';

describe('JobsDiscoveryController', () => {
  let controller: JobsDiscoveryController;
  let jobsDiscoveryService: JobsDiscoveryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsDiscoveryController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [
        JobsDiscoveryService,
        JobsDiscoveryProfile,
        {
          provide: HttpService,
          useValue: {
            request: jest
              .fn()
              .mockImplementation(() =>
                Promise.resolve({ data: responseFixture }),
              ),
          },
        },
      ],
    })
      .overrideProvider(JobsDiscoveryService)
      .useValue(jobsDiscoveryServiceMock)
      .compile();

    controller = module.get<JobsDiscoveryController>(JobsDiscoveryController);
    jobsDiscoveryService =
      module.get<JobsDiscoveryService>(JobsDiscoveryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('processJobsDiscovery', () => {
    it('should call service processJobsDiscovery method with proper fields set', async () => {
      const dto = dtoFixture;
      const command = jobsDiscoveryParamsCommandFixture;
      await controller.getJobs(dto, jobDiscoveryToken);
      expect(jobsDiscoveryService.processJobsDiscovery).toHaveBeenCalledWith(
        command,
      );
    });
  });
});
