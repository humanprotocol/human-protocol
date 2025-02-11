import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EnvironmentConfigService } from './environment-config.service';
import { ChainId } from '@human-protocol/sdk';

describe('EnvironmentConfigService', () => {
  let service: EnvironmentConfigService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvironmentConfigService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EnvironmentConfigService>(EnvironmentConfigService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should return an array of valid ChainIds when CHAIN_IDS_ENABLED is valid', () => {
    (configService.getOrThrow as jest.Mock).mockReturnValue(
      '1, 11155111, 80002',
    );

    const result = service.chainIdsEnabled;

    expect(result).toEqual([
      ChainId.MAINNET,
      ChainId.SEPOLIA,
      ChainId.POLYGON_AMOY,
    ]);
  });

  it('should ignore invalid chain IDs and only return valid ChainIds', () => {
    (configService.getOrThrow as jest.Mock).mockReturnValue(
      '1, 11155111, 99999, 80002',
    );

    const result = service.chainIdsEnabled;

    expect(result).toEqual([
      ChainId.MAINNET,
      ChainId.SEPOLIA,
      ChainId.POLYGON_AMOY,
    ]);
  });

  it('should return an empty array if CHAIN_IDS_ENABLED is empty', () => {
    (configService.getOrThrow as jest.Mock).mockReturnValue('');

    const result = service.chainIdsEnabled;

    expect(result).toEqual([]);
  });
});
