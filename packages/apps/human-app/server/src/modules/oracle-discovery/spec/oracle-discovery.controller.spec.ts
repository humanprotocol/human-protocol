import { Test, TestingModule } from '@nestjs/testing';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { OracleDiscoveryController } from '../oracle-discovery.controller';
import { OracleDiscoveryService } from '../oracle-discovery.service';
import { oracleDiscoveryServiceMock } from './oracle-discovery.service.mock';
import { OracleDiscoveryResponse } from '../model/oracle-discovery.model';
import { generateOracleDiscoveryResponseBody } from './oracle-discovery.fixture';

describe('OracleDiscoveryController', () => {
  let controller: OracleDiscoveryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OracleDiscoveryController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [OracleDiscoveryService],
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

  describe('oracle discovery', () => {
    it('oracle discovery should be return OracleDiscoveryData', async () => {
      const result: OracleDiscoveryResponse[] = await controller.getOracles();
      const expectedResponse = generateOracleDiscoveryResponseBody();
      expect(result).toEqual(expectedResponse);
    });
  });
});
