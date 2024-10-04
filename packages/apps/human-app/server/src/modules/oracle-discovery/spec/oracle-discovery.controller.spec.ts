import { Test, TestingModule } from '@nestjs/testing';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { OracleDiscoveryController } from '../oracle-discovery.controller';
import { OracleDiscoveryService } from '../oracle-discovery.service';
import { oracleDiscoveryServiceMock } from './oracle-discovery.service.mock';
import { OracleDiscoveryProfile } from '../oracle-discovery.mapper.profile';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { CommonConfigModule } from '../../../common/config/common-config.module';
import { ConfigModule } from '@nestjs/config';

describe('OracleDiscoveryController', () => {
  let controller: OracleDiscoveryController;

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
        EnvironmentConfigService,
      ],
    })
      .overrideProvider(OracleDiscoveryService)
      .useValue(oracleDiscoveryServiceMock)
      .compile();

    controller = module.get<OracleDiscoveryController>(
      OracleDiscoveryController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
