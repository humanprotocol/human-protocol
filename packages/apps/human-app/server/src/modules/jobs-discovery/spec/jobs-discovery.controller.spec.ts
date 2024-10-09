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
import { JobsDiscoveryProfile } from '../jobs-discovery.mapper.profile';
import { HttpService } from '@nestjs/axios';
import { CommonConfigModule } from '../../../common/config/common-config.module';
import { ConfigModule } from '@nestjs/config';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';

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
        CommonConfigModule,
        ConfigModule.forRoot({
          envFilePath: '.env',
          isGlobal: true,
        }),
      ],
      providers: [
        JobsDiscoveryService,
        JobsDiscoveryProfile,
        EnvironmentConfigService,
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
      await controller.getJobs(
        dto,
        { qualifications: [] } as any,
        jobDiscoveryToken,
      );
      command.data.qualifications = [];
      expect(jobsDiscoveryService.processJobsDiscovery).toHaveBeenCalledWith(
        command,
      );
    });
  });
});
