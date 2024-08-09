import { OperatorUtils } from '@human-protocol/sdk';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { CommonConfigModule } from '../../../common/config/common-config.module';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { OracleDiscoveryResponse } from '../model/oracle-discovery.model';
import { OracleDiscoveryService } from '../oracle-discovery.service';
import {
  emptyCommandFixture,
  filledCommandFixture,
  generateOracleDiscoveryResponseBody,
  notSetCommandFixture,
} from './oracle-discovery.fixture';

jest.mock('@human-protocol/sdk', () => {
  const actualSdk = jest.requireActual('@human-protocol/sdk');
  return {
    ...actualSdk,
    OperatorUtils: {
      getReputationNetworkOperators: jest.fn(),
    },
  };
});

describe('OracleDiscoveryService', () => {
  const EXCHANGE_ORACLE = 'Exchange Oracle';
  const EXPECTED_CHAIN_IDS = ['4200'];
  const REPUTATION_ORACLE_ADDRESS = 'the_oracle';
  const TTL = '300';
  let oracleDiscoveryService: OracleDiscoveryService;
  let cacheManager: Cache;

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
      {
        address: 'mockAddress1',
        role: 'validator',
        chainId: '4200',
        active: true,
        retriesCount: 0,
      },
      {
        address: 'mockAddress2',
        role: 'validator',
        chainId: '4200',
        active: true,
        retriesCount: 0,
      },
    ];
    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(mockData);

    const result =
      await oracleDiscoveryService.processOracleDiscovery(notSetCommandFixture);

    expect(result).toEqual(mockData);
    expect(OperatorUtils.getReputationNetworkOperators).not.toHaveBeenCalled();
  });

  it('should fetch and cache data if not already cached', async () => {
    const mockData: OracleDiscoveryResponse[] = [
      {
        address: 'mockAddress1',
        role: 'validator',
        url: 'url1',
        chainId: '4200',
        active: true,
        retriesCount: 0,
      },
      {
        address: 'mockAddress2',
        role: 'validator',
        chainId: '4200',
        active: true,
        retriesCount: 0,
      },
    ];

    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(undefined);
    jest
      .spyOn(OperatorUtils, 'getReputationNetworkOperators')
      .mockResolvedValue(mockData);

    const result =
      await oracleDiscoveryService.processOracleDiscovery(emptyCommandFixture);

    expect(result).toEqual([mockData[0]]);
    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      expect(cacheManager.get).toHaveBeenCalledWith(chainId);
      expect(cacheManager.set).toHaveBeenCalledWith(
        chainId,
        [mockData[0]],
        TTL,
      );
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

  it('should handle errors and return an empty array', async () => {
    const error = new Error('Test error');
    jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
    jest
      .spyOn(OperatorUtils, 'getReputationNetworkOperators')
      .mockRejectedValueOnce(error);

    const loggerErrorSpy = jest.spyOn(
      oracleDiscoveryService['logger'],
      'error',
    );

    const result =
      await oracleDiscoveryService.processOracleDiscovery(emptyCommandFixture);

    expect(result).toEqual([]);
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      `Error processing chainId 4200:`,
      error,
    );
  });

  it('should return an empty array if no oracles are found', async () => {
    jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
    jest
      .spyOn(OperatorUtils, 'getReputationNetworkOperators')
      .mockResolvedValue([]);

    const result =
      await oracleDiscoveryService.processOracleDiscovery(emptyCommandFixture);

    expect(result).toEqual([]);
    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      expect(cacheManager.get).toHaveBeenCalledWith(chainId);
    });
  });

  it('should filter out inactive oracles from cached data', async () => {
    const mockData: OracleDiscoveryResponse[] = [
      {
        address: 'mockAddress1',
        role: 'validator',
        chainId: '4200',
        active: false,
        retriesCount: 0,
      },
      {
        address: 'mockAddress2',
        role: 'validator',
        chainId: '4200',
        active: true,
        retriesCount: 0,
      },
    ];
    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(mockData);

    const result =
      await oracleDiscoveryService.processOracleDiscovery(notSetCommandFixture);

    expect(result).toEqual([mockData[1]]);
    expect(OperatorUtils.getReputationNetworkOperators).not.toHaveBeenCalled();
  });

  it('should return an empty array if all oracles are inactive', async () => {
    const mockData: OracleDiscoveryResponse[] = [
      {
        address: 'mockAddress1',
        role: 'validator',
        chainId: '4200',
        active: false,
        retriesCount: 0,
      },
      {
        address: 'mockAddress2',
        role: 'validator',
        chainId: '4200',
        active: false,
        retriesCount: 0,
      },
    ];
    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(mockData);

    const result =
      await oracleDiscoveryService.processOracleDiscovery(notSetCommandFixture);

    expect(result).toEqual([]);
    expect(OperatorUtils.getReputationNetworkOperators).not.toHaveBeenCalled();
  });
});
