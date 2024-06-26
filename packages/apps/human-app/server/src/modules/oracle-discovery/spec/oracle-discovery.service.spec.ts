import { Test } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { OracleDiscoveryService } from '../oracle-discovery.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { OperatorUtils } from '@human-protocol/sdk';
import { OracleDiscoveryResponse } from '../model/oracle-discovery.model';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { CommonConfigModule } from '../../../common/config/common-config.module';
import { ConfigModule } from '@nestjs/config';

jest.mock('@human-protocol/sdk', () => ({
  OperatorUtils: {
    getReputationNetworkOperators: jest.fn(),
  },
}));

describe('OracleDiscoveryService', () => {
  const EXCHANGE_ORACLE = 'Exchange Oracle';
  let oracleDiscoveryService: OracleDiscoveryService;
  let cacheManager: Cache;
  let configService: EnvironmentConfigService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        CommonConfigModule,
        ConfigModule.forRoot({
          envFilePath: '.env',
          isGlobal: true,
        }),
      ],
      providers: [
        OracleDiscoveryService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: EnvironmentConfigService,
          useValue: {
            reputationOracleAddress: 'mockedaddress',
            cacheTtlOracleDiscovery: 86400,
            chainIdsEnabled: ['80001'],
          },
        },
      ],
    }).compile();
    configService = moduleRef.get<EnvironmentConfigService>(
      EnvironmentConfigService,
    );
    oracleDiscoveryService = moduleRef.get<OracleDiscoveryService>(
      OracleDiscoveryService,
    );
    cacheManager = moduleRef.get<Cache>(CACHE_MANAGER);
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

    const result = await oracleDiscoveryService.processOracleDiscovery();

    expect(result).toEqual(mockData);
    expect(OperatorUtils.getReputationNetworkOperators).not.toHaveBeenCalled();
  });

  it('should fetch and cache data if not already cached', async () => {
    const mockData: OracleDiscoveryResponse[] = [
      { address: 'mockAddress1', role: 'validator' },
      { address: 'mockAddress2', role: 'validator' },
    ];
    const chainId = 80001;

    jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
    jest
      .spyOn(OperatorUtils, 'getReputationNetworkOperators')
      .mockResolvedValue(mockData);

    const result = await oracleDiscoveryService.processOracleDiscovery();

    expect(result).toEqual(mockData);
    expect(cacheManager.get).toHaveBeenCalledWith(chainId.toString());
    expect(cacheManager.set).toHaveBeenCalledWith(
      chainId.toString(),
      mockData,
      configService.cacheTtlOracleDiscovery,
    );
    expect(OperatorUtils.getReputationNetworkOperators).toHaveBeenCalledWith(
      chainId,
      'mockedaddress',
      EXCHANGE_ORACLE,
    );
  });
});
