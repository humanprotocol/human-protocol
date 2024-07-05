import { Test } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { OracleDiscoveryService } from '../oracle-discovery.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { OperatorUtils } from '@human-protocol/sdk';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryResponse,
} from '../model/oracle-discovery.model';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { CommonConfigModule } from '../../../common/config/common-config.module';
import { ConfigModule } from '@nestjs/config';
import {
  emptyCommandFixture,
  filledCommandFixture,
  generateOracleDiscoveryResponseBody,
  notSetCommandFixture,
} from './oracle-discovery.fixture';

jest.mock('@human-protocol/sdk', () => ({
  OperatorUtils: {
    getReputationNetworkOperators: jest.fn(),
  },
}));
describe('OracleDiscoveryService', () => {
  const EXCHANGE_ORACLE = 'Exchange Oracle';
  const EXPECTED_CHAIN_IDS = ['4200'];
  const REPUTATION_ORACLE_ADDRESS = 'the_oracle';
  const TTL = '300';
  let oracleDiscoveryService: OracleDiscoveryService;
  let cacheManager: Cache;
  let configService: EnvironmentConfigService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        CommonConfigModule,
        ConfigModule.forRoot({
          envFilePath: '.env',
          isGlobal: true,
        }),
      ],
      providers: [
        {
          provide: EnvironmentConfigService,
          useValue: {
            chainIdsEnabled: EXPECTED_CHAIN_IDS,
            reputationOracleAddress: REPUTATION_ORACLE_ADDRESS,
            cacheTtlOracleDiscovery: TTL,
          },
        },
        OracleDiscoveryService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();
    configService = module.get<EnvironmentConfigService>(
      EnvironmentConfigService,
    );
    oracleDiscoveryService = module.get<OracleDiscoveryService>(
      OracleDiscoveryService,
    );
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should be defined', () => {
    expect(oracleDiscoveryService).toBeDefined();
  });

  it('should return cached data if available', async () => {
    const mockData: OracleDiscoveryResponse[] = [
      { address: 'mockAddress1', role: 'validator' },
      { address: 'mockAddress2', role: 'validator' },
    ];
    jest.spyOn(cacheManager, 'get').mockResolvedValue(mockData);

    const result =
      await oracleDiscoveryService.processOracleDiscovery(notSetCommandFixture);

    expect(result).toEqual(mockData);
    expect(OperatorUtils.getReputationNetworkOperators).not.toHaveBeenCalled();
  });

  it('should fetch and cache data if not already cached', async () => {
    const mockData: OracleDiscoveryResponse[] = [
      { address: 'mockAddress1', role: 'validator', url: 'url1' },
      { address: 'mockAddress2', role: 'validator' },
    ];

    jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
    jest
      .spyOn(OperatorUtils, 'getReputationNetworkOperators')
      .mockResolvedValue(mockData);

    const result =
      await oracleDiscoveryService.processOracleDiscovery(emptyCommandFixture);

    expect(result).toEqual([mockData[0]]);
    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      expect(cacheManager.get).toHaveBeenCalledWith(chainId);
      expect(cacheManager.set).toHaveBeenCalledWith(chainId, [mockData[0]], {
        ttl: TTL,
      });
      expect(OperatorUtils.getReputationNetworkOperators).toHaveBeenCalledWith(
        Number(chainId),
        REPUTATION_ORACLE_ADDRESS,
        EXCHANGE_ORACLE,
      );
    });
  });
  it('should filter responses if selectedJobTypes not empty, or url not set', async () => {
    const mockData: OracleDiscoveryResponse[] =
      generateOracleDiscoveryResponseBody();

    jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
    jest
      .spyOn(OperatorUtils, 'getReputationNetworkOperators')
      .mockResolvedValue(mockData);

    const result =
      await oracleDiscoveryService.processOracleDiscovery(filledCommandFixture);

    expect(result).toEqual([mockData[1], mockData[2]]);
  });
});
