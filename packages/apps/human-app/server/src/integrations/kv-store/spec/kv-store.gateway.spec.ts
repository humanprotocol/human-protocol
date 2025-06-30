jest.mock('@human-protocol/sdk', () => {
  const actualSdk = jest.requireActual('@human-protocol/sdk');
  const mockedSdk = jest.createMockFromModule<
    typeof import('@human-protocol/sdk')
  >('@human-protocol/sdk');

  return {
    ...actualSdk,
    KVStoreUtils: mockedSdk.KVStoreUtils,
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

import { ChainId, KVStoreKeys, KVStoreUtils } from '@human-protocol/sdk';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';

import { Cache } from 'cache-manager';

import { KvStoreGateway } from '../kv-store.gateway';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { ORACLE_URL_CACHE_KEY } from '../../../common/constants/cache';

const EXPECTED_URL = 'https://example.com';

const mockedKvStoreUtils = jest.mocked(KVStoreUtils);

describe('KvStoreGateway', () => {
  let service: KvStoreGateway;
  let configService: EnvironmentConfigService;
  let cacheManager: Cache & { get: jest.Mock; set: jest.Mock };

  beforeEach(async () => {
    configService = {
      rpcUrl: 'https://localhost:8545',
      cacheTtlExchangeOracleUrl: 2137,
    } as any;

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
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getExchangeOracleUrlByAddress', () => {
    it('should get data from kvStoreUtils, if not cached', async () => {
      const testAddress = 'testAddress';
      const cacheKey = `${ORACLE_URL_CACHE_KEY}:${testAddress}`;
      const expectedUrl = EXPECTED_URL;
      mockedKvStoreUtils.get.mockResolvedValue(expectedUrl + '/');
      cacheManager.get.mockResolvedValue(undefined);

      const result = await service.getExchangeOracleUrlByAddress(testAddress);

      expect(KVStoreUtils.get).toHaveBeenCalledWith(
        ChainId.LOCALHOST,
        testAddress,
        KVStoreKeys.url,
      );

      expect(cacheManager.set).toHaveBeenCalledWith(
        cacheKey,
        expectedUrl,
        configService.cacheTtlExchangeOracleUrl,
      );
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toBe(expectedUrl);
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
