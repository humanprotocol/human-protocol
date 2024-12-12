import { Test, TestingModule } from '@nestjs/testing';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { OracleDiscoveryController } from '../oracle-discovery.controller';
import { OracleDiscoveryService } from '../oracle-discovery.service';
import { oracleDiscoveryServiceMock } from './oracle-discovery.service.mock';
import {
  GetOraclesQuery,
  DiscoveredOracle,
} from '../model/oracle-discovery.model';
import { generateOracleDiscoveryResponseBody } from './oracle-discovery.fixture';
import { OracleDiscoveryProfile } from '../oracle-discovery.mapper.profile';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { CommonConfigModule } from '../../../common/config/common-config.module';
import { ConfigModule } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ChainId } from '@human-protocol/sdk';

describe('OracleDiscoveryController', () => {
  let controller: OracleDiscoveryController;
  let serviceMock: OracleDiscoveryService;
  const configServiceMock: Partial<EnvironmentConfigService> = {
    email: 'human-app@hmt.ai',
    password: 'Test1234*',
    cacheTtlOracleDiscovery: 600,
    chainIdsEnabled: [ChainId.POLYGON, ChainId.MAINNET],
    jobsDiscoveryFlag: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OracleDiscoveryController],
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
        OracleDiscoveryService,
        OracleDiscoveryProfile,
        { provide: EnvironmentConfigService, useValue: configServiceMock },
      ],
    })
      .overrideProvider(OracleDiscoveryService)
      .useValue(oracleDiscoveryServiceMock)
      .compile();

    controller = module.get<OracleDiscoveryController>(
      OracleDiscoveryController,
    );
    serviceMock = module.get<OracleDiscoveryService>(OracleDiscoveryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('oracle discovery', () => {
    it('should return discovered oracles', async () => {
      const dtoFixture = {
        selected_job_types: ['job-type-1', 'job-type-2'],
      } as GetOraclesQuery;
      const result: DiscoveredOracle[] =
        await controller.getOracles(dtoFixture);
      const expectedResponse = generateOracleDiscoveryResponseBody();
      expect(serviceMock.getOracles).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });

    it('should throw an error if jobsDiscoveryFlag is disabled', async () => {
      const dtoFixture = {
        selected_job_types: ['job-type-1', 'job-type-2'],
      } as GetOraclesQuery;

      (configServiceMock as any).jobsDiscoveryFlag = false;

      await expect(controller.getOracles(dtoFixture)).rejects.toThrow(
        new HttpException(
          'Oracles discovery is disabled',
          HttpStatus.FORBIDDEN,
        ),
      );
    });
  });
});
