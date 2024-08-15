import { Test, TestingModule } from '@nestjs/testing';
import { KvStoreGateway } from '../kv-store.gateway';
import { ChainId, KVStoreKeys, KVStoreUtils } from '@human-protocol/sdk';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ORACLE_URL_CACHE_KEY } from '../../../common/constants/cache';

const EXPECTED_URL = 'https://example.com';
jest.mock('@human-protocol/sdk', () => {
  const actualSdk = jest.requireActual('@human-protocol/sdk');
  return {
    ...actualSdk,
    KVStoreUtils: {
      get: jest.fn().mockResolvedValue('https://example.com'),
    },
  };
});

jest.mock('ethers', () => {
  const actualEthers = jest.requireActual('ethers');
  const mockProvider = {
    provider: {
      getNetwork: jest.fn().mockResolvedValue({
        chainId: 1338,
      }),
    },
  };
  return {
    ...actualEthers,
    ethers: {
      ...actualEthers.ethers,
      JsonRpcProvider: jest.fn(() => mockProvider),
    },
  };
});

describe('KvStoreGateway', () => {
  let service: KvStoreGateway;
  let configService: EnvironmentConfigService;
  let mockKVStoreUtils: any;
  let cacheManager: Cache & { get: jest.Mock; set: jest.Mock };

  beforeEach(async () => {
    configService = {
      rpcUrl: 'https://localhost:8545',
      cacheTtlExchangeOracleUrl: 2137,
    } as any;

    mockKVStoreUtils = {
      get: jest.fn(),
    };
    const cacheManagerMock = {
      get: jest.fn(),
      set: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KvStoreGateway,
        {
          provide: EnvironmentConfigService,
          useValue: configService,
        },
        {
          provide: KVStoreUtils,
          useValue: mockKVStoreUtils,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManagerMock,
        },
      ],
    }).compile();
    cacheManager = module.get(CACHE_MANAGER);
    configService = module.get(EnvironmentConfigService);
    service = module.get<KvStoreGateway>(KvStoreGateway);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('getExchangeOracleUrlByAddress', () => {
    it('should get data from kvStoreUtils, if not cached', async () => {
      const testAddress = 'testAddress';
      const cacheKey = `${ORACLE_URL_CACHE_KEY}:${testAddress}`;
      const expectedData = EXPECTED_URL;
      mockKVStoreUtils.get.mockResolvedValue(expectedData);
      cacheManager.get.mockResolvedValue(undefined);
      const result = await service.getExchangeOracleUrlByAddress(testAddress);
      expect(KVStoreUtils.get).toHaveBeenCalledWith(
        ChainId.LOCALHOST,
        testAddress,
        KVStoreKeys.url,
      );

      expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, expectedData, {
        ttl: configService.cacheTtlExchangeOracleUrl,
      });
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toBe(expectedData);
    });
    it('should get data from cache, if available', async () => {
      const testAddress = 'testAddress';
      const cacheKey = `${ORACLE_URL_CACHE_KEY}:${testAddress}`;
      const expectedData = EXPECTED_URL;
      cacheManager.get.mockResolvedValue(expectedData);
      const result = await service.getExchangeOracleUrlByAddress(testAddress);

      expect(KVStoreUtils.get).not.toHaveBeenCalled();
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toBe(expectedData);
    });
  });
});
