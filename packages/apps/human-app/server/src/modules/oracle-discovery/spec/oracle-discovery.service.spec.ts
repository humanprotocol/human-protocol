import { ChainId, OperatorUtils } from '@human-protocol/sdk';
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
  reputationOracleSupportedJobTypes,
} from './oracle-discovery.fixture';
import { KvStoreGateway } from '../../../integrations/kv-store/kv-store.gateway';

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
  const EXPECTED_CHAIN_IDS = [ChainId.POLYGON_AMOY];
  const REPUTATION_ORACLE_ADDRESS = 'the_oracle';
  const TTL = '300';
  const JOB_TYPES = 'job-type-1, job-type-2, job-type-3';
  let oracleDiscoveryService: OracleDiscoveryService;
  let cacheManager: Cache;
  let kvStoreGateway: KvStoreGateway;

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
          provide: KvStoreGateway,
          useValue: {
            getJobTypesByAddress: jest.fn().mockReturnValue(JOB_TYPES),
          },
        },
        {
          provide: EnvironmentConfigService,
          useValue: {
            chainIdsEnabled: EXPECTED_CHAIN_IDS,
            reputationOracleAddress: REPUTATION_ORACLE_ADDRESS,
            cacheTtlOracleDiscovery: TTL,
            maxRequestRetries: 5,
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
    kvStoreGateway = module.get<KvStoreGateway>(KvStoreGateway);
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
        chainId: ChainId.POLYGON_AMOY,
        retriesCount: 0,
        executionsToSkip: 0,
      },
      {
        address: 'mockAddress2',
        role: 'validator',
        chainId: ChainId.POLYGON_AMOY,
        retriesCount: 0,
        executionsToSkip: 0,
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
        chainId: ChainId.POLYGON_AMOY,
        retriesCount: 0,
        executionsToSkip: 0,
        jobTypes: ['job-type-1'],
      },
      {
        address: 'mockAddress2',
        role: 'validator',
        chainId: ChainId.POLYGON_AMOY,
        retriesCount: 0,
        executionsToSkip: 0,
        jobTypes: ['job-type-2'],
      },
    ];

    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(undefined);
    jest
      .spyOn(OperatorUtils, 'getReputationNetworkOperators')
      .mockResolvedValueOnce(mockData);

    const result =
      await oracleDiscoveryService.processOracleDiscovery(emptyCommandFixture);

    expect(result).toEqual([mockData[0]]);
    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      expect(cacheManager.get).toHaveBeenCalledWith(chainId.toString());
      expect(cacheManager.set).toHaveBeenCalledWith(
        chainId.toString(),
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

  it('should filter oracles if selectedJobTypes not empty, or url not set', async () => {
    const mockData: OracleDiscoveryResponse[] =
      generateOracleDiscoveryResponseBody();

    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(undefined);
    jest
      .spyOn(OperatorUtils, 'getReputationNetworkOperators')
      .mockResolvedValueOnce(mockData);

    const result =
      await oracleDiscoveryService.processOracleDiscovery(filledCommandFixture);
    expect(result).toEqual([mockData[1], mockData[2]]);
  });

  it('should not filter responses if selectedJobTypes is empty', async () => {
    const mockData: OracleDiscoveryResponse[] =
      generateOracleDiscoveryResponseBody();

    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(undefined);
    jest
      .spyOn(OperatorUtils, 'getReputationNetworkOperators')
      .mockResolvedValueOnce(mockData);

    const result = await oracleDiscoveryService.processOracleDiscovery({
      selectedJobTypes: [],
    });

    expect(result).toEqual([mockData[0], mockData[1], mockData[2]]);
  });

  it('should filter out oracles that do not support the specified reputation oracle types', async () => {
    const mockData: OracleDiscoveryResponse[] =
      generateOracleDiscoveryResponseBody();

    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(undefined);
    jest
      .spyOn(OperatorUtils, 'getReputationNetworkOperators')
      .mockResolvedValueOnce(mockData);

    jest
      .spyOn(kvStoreGateway, 'getJobTypesByAddress')
      .mockResolvedValueOnce(reputationOracleSupportedJobTypes);

    const result = await oracleDiscoveryService.processOracleDiscovery({});
    expect(result).toEqual([mockData[1]]);
  });

  it('should handle errors and return an empty array', async () => {
    const error = new Error('Test error');
    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(undefined);
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
      `Error processing chainId ${ChainId.POLYGON_AMOY}:`,
      error,
    );
  });

  it('should return an empty array if no oracles are found', async () => {
    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(undefined);
    jest
      .spyOn(OperatorUtils, 'getReputationNetworkOperators')
      .mockResolvedValueOnce([]);

    const result =
      await oracleDiscoveryService.processOracleDiscovery(emptyCommandFixture);

    expect(result).toEqual([]);
    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      expect(cacheManager.get).toHaveBeenCalledWith(chainId.toString());
    });
  });
});
