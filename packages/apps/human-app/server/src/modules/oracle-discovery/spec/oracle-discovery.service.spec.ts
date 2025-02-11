import { ChainId, OperatorUtils, Role } from '@human-protocol/sdk';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { CommonConfigModule } from '../../../common/config/common-config.module';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { OracleDiscoveryService } from '../oracle-discovery.service';
import {
  emptyCommandFixture,
  errorResponse,
  filledCommandFixture,
  generateGetReputationNetworkOperatorsResponseByChainId,
  generateOracleDiscoveryResponseBody,
  generateOracleDiscoveryResponseBodyByChainId,
  generateOracleDiscoveryResponseBodyByJobType,
  notSetCommandFixture,
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
  const EXCHANGE_ORACLE = Role.ExchangeOracle;
  const EXPECTED_CHAIN_IDS = [ChainId.POLYGON_AMOY, ChainId.BSC_TESTNET];
  const REPUTATION_ORACLE_ADDRESS = 'the_oracle';
  const TTL = '300';
  const JOB_TYPES = 'job-type-1,job-type-2,job-type-3';
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
    const mockData = generateOracleDiscoveryResponseBody();
    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      jest
        .spyOn(cacheManager, 'get')
        .mockResolvedValueOnce(
          generateOracleDiscoveryResponseBodyByChainId(chainId),
        );
    });

    const result =
      await oracleDiscoveryService.getOracles(notSetCommandFixture);

    expect(result).toEqual(mockData);
    expect(OperatorUtils.getReputationNetworkOperators).not.toHaveBeenCalled();
  });

  it('should fetch and cache data if not already cached', async () => {
    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      jest
        .spyOn(OperatorUtils, 'getReputationNetworkOperators')
        .mockResolvedValueOnce(
          generateGetReputationNetworkOperatorsResponseByChainId(chainId),
        );
    });

    const result = await oracleDiscoveryService.discoverOracles();

    expect(result).toEqual(generateOracleDiscoveryResponseBody());
    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      expect(cacheManager.get).toHaveBeenCalledWith(chainId.toString());
      expect(cacheManager.set).toHaveBeenCalledWith(
        chainId.toString(),
        generateOracleDiscoveryResponseBodyByChainId(chainId),
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
    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      jest
        .spyOn(OperatorUtils, 'getReputationNetworkOperators')
        .mockResolvedValueOnce(
          generateGetReputationNetworkOperatorsResponseByChainId(chainId),
        );
    });

    const result =
      await oracleDiscoveryService.getOracles(filledCommandFixture);

    expect(result).toEqual(
      generateOracleDiscoveryResponseBodyByJobType('job-type-1'),
    );
  });

  it('should not filter responses if selectedJobTypes is empty', async () => {
    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      jest
        .spyOn(OperatorUtils, 'getReputationNetworkOperators')
        .mockResolvedValueOnce(
          generateGetReputationNetworkOperatorsResponseByChainId(chainId),
        );
    });

    const result = await oracleDiscoveryService.getOracles({
      selectedJobTypes: [],
    });

    expect(result).toEqual(generateOracleDiscoveryResponseBody());
  });

  it('should handle errors and return an empty array of oracles', async () => {
    const error = new Error('Test error');
    jest
      .spyOn(OperatorUtils, 'getReputationNetworkOperators')
      .mockRejectedValueOnce(error);

    const loggerErrorSpy = jest.spyOn(
      oracleDiscoveryService['logger'],
      'error',
    );

    const result = await oracleDiscoveryService.discoverOracles();

    expect(result).toEqual(errorResponse);
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      `Failed to discover oracles for chain '${ChainId.POLYGON_AMOY}':`,
      error,
    );
  });

  it('should return an empty array of oracles if no oracles are found', async () => {
    jest
      .spyOn(OperatorUtils, 'getReputationNetworkOperators')
      .mockResolvedValueOnce([]);

    const result = await oracleDiscoveryService.getOracles(emptyCommandFixture);

    expect(result).toEqual(errorResponse);
    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      expect(cacheManager.get).toHaveBeenCalledWith(chainId.toString());
    });
  });

  it('should return only relevant oracles based on supported job types', async () => {
    jest
      .spyOn(kvStoreGateway, 'getJobTypesByAddress')
      .mockResolvedValueOnce('job-type-1');

    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      jest
        .spyOn(OperatorUtils, 'getReputationNetworkOperators')
        .mockResolvedValueOnce(
          generateGetReputationNetworkOperatorsResponseByChainId(chainId),
        );
    });

    const result = await oracleDiscoveryService.getOracles({});

    const expectedResponse =
      generateOracleDiscoveryResponseBodyByJobType('job-type-1');
    expect(result).toEqual(expectedResponse);

    result.forEach((oracle) => {
      expect(oracle.jobTypes).toContain('job-type-1');
    });
  });
});
