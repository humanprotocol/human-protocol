import { OperatorUtils } from '@human-protocol/sdk';
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
  const EXPECTED_CHAIN_IDS = ['4200', '4201'];
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
      await oracleDiscoveryService.processOracleDiscovery(notSetCommandFixture);

    expect(result).toEqual(mockData);
    expect(OperatorUtils.getReputationNetworkOperators).not.toHaveBeenCalled();
  });

  it('should fetch and cache data if not already cached', async () => {
    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(undefined);
    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      jest
        .spyOn(OperatorUtils, 'getReputationNetworkOperators')
        .mockResolvedValueOnce(
          generateGetReputationNetworkOperatorsResponseByChainId(chainId),
        );
    });

    const result =
      await oracleDiscoveryService.processOracleDiscovery(emptyCommandFixture);

    expect(result).toEqual(generateOracleDiscoveryResponseBody());
    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      expect(cacheManager.get).toHaveBeenCalledWith(chainId);
      expect(cacheManager.set).toHaveBeenCalledWith(
        chainId,
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
    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(undefined);
    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      jest
        .spyOn(OperatorUtils, 'getReputationNetworkOperators')
        .mockResolvedValueOnce(
          generateGetReputationNetworkOperatorsResponseByChainId(chainId),
        );
    });

    const result =
      await oracleDiscoveryService.processOracleDiscovery(filledCommandFixture);

    expect(result).toEqual(generateOracleDiscoveryResponseBodyByJobType());
  });

  it('should not filter responses if selectedJobTypes is empty', async () => {
    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(undefined);
    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      jest
        .spyOn(OperatorUtils, 'getReputationNetworkOperators')
        .mockResolvedValueOnce(
          generateGetReputationNetworkOperatorsResponseByChainId(chainId),
        );
    });

    const result = await oracleDiscoveryService.processOracleDiscovery({
      selectedJobTypes: [],
    });

    expect(result).toEqual(generateOracleDiscoveryResponseBody());
  });

  it('should handle errors and return an empty array of oracles', async () => {
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

    expect(result).toEqual(errorResponse);
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      `Error processing chainId 4200:`,
      error,
    );
  });

  it('should return an empty array of oracles if no oracles are found', async () => {
    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(undefined);
    jest
      .spyOn(OperatorUtils, 'getReputationNetworkOperators')
      .mockResolvedValueOnce([]);

    const result =
      await oracleDiscoveryService.processOracleDiscovery(emptyCommandFixture);

    expect(result).toEqual(errorResponse);
    EXPECTED_CHAIN_IDS.forEach((chainId) => {
      expect(cacheManager.get).toHaveBeenCalledWith(chainId);
    });
  });
});
