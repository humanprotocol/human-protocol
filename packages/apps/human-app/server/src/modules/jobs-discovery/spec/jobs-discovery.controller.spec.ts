import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { ChainId } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonConfigModule } from '../../../common/config/common-config.module';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { JobsDiscoveryController } from '../jobs-discovery.controller';
import { JobsDiscoveryProfile } from '../jobs-discovery.mapper.profile';
import { JobsDiscoveryService } from '../jobs-discovery.service';
import {
  dtoFixture,
  jobsDiscoveryParamsCommandFixture,
  responseFixture,
} from './jobs-discovery.fixtures';
import { jobsDiscoveryServiceMock } from './jobs-discovery.service.mock';

describe('JobsDiscoveryController', () => {
  let controller: JobsDiscoveryController;
  let jobsDiscoveryService: JobsDiscoveryService;
  const configServiceMock: Partial<EnvironmentConfigService> = {
    cacheTtlOracleDiscovery: 600,
    chainIdsEnabled: [ChainId.POLYGON, ChainId.MAINNET],
    jobsDiscoveryFlag: true,
  };

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
        { provide: EnvironmentConfigService, useValue: configServiceMock },
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
      await controller.getJobs(dto, {
        user: { qualifications: [] },
        token: command.token,
      } as any);
      command.data.qualifications = [];
      expect(jobsDiscoveryService.processJobsDiscovery).toHaveBeenCalledWith(
        command,
      );
    });

    it('should throw an error if jobsDiscoveryFlag is disabled', async () => {
      const dto = dtoFixture;
      (configServiceMock as any).jobsDiscoveryFlag = false;
      await expect(
        controller.getJobs(dto, { user: { qualifications: [] } } as any),
      ).rejects.toThrow(
        new HttpException('Jobs discovery is disabled', HttpStatus.FORBIDDEN),
      );
    });
  });
});
