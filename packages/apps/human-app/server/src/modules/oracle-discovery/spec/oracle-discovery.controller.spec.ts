import { Test, TestingModule } from '@nestjs/testing';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { OracleDiscoveryController } from '../oracle-discovery.controller';
import { OracleDiscoveryService } from '../oracle-discovery.serivce';
import { oracleDiscoveryServiceMock } from './oracle-discovery.service.mock';
import { OracleDiscoveryProfile } from '../oracle-discovery.mapper';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryResponse,
  OracleDiscoveryDto,
} from '../interface/oracle-discovery.interface';
import { ChainId } from '@human-protocol/sdk';
import { generateOracleDiscoveryResponseBody } from './oracle-discovery.fixture';

describe('OracleDiscoveryController', () => {
  let controller: OracleDiscoveryController;
  let service: OracleDiscoveryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OracleDiscoveryController],
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [OracleDiscoveryService, OracleDiscoveryProfile],
    })
      .overrideProvider(OracleDiscoveryService)
      .useValue(oracleDiscoveryServiceMock)
      .compile();

    controller = module.get<OracleDiscoveryController>(
      OracleDiscoveryController,
    );
    service = module.get<OracleDiscoveryService>(OracleDiscoveryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('oracle discovery', () => {
    it('oracle discovery should be called with input in OracleDiscoveryDto format and return OracleDiscoveryData', async () => {
      const dto: OracleDiscoveryDto = {
        chainId: 80001,
        address: '0x4708354213453af0cdC33eb75d94fBC00045841E',
        role: 'Exchange Oracle',
      };
      const result: OracleDiscoveryResponse[] =
        await controller.getOracles(dto);
      const expectedCommand = {
        chainId: ChainId.POLYGON_MUMBAI,
        address: dto.address,
        role: 'Exchange Oracle',
      } as OracleDiscoveryCommand;
      expect(service.processOracleDiscovery).toHaveBeenCalledWith(
        expectedCommand,
      );
      const expectedResponse = generateOracleDiscoveryResponseBody();
      expect(result).toEqual(expectedResponse);
    });
  });
});
