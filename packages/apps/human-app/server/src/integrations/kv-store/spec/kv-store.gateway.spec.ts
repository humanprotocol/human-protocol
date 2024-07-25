import { Test, TestingModule } from '@nestjs/testing';
import { KvStoreGateway } from '../kv-store.gateway';
import { KVStoreClient, KVStoreKeys } from '@human-protocol/sdk';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { ethers } from 'ethers';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

const EXPECTED_URL = 'https://example.com';
jest.mock('@human-protocol/sdk', () => {
  const actualSdk = jest.requireActual('@human-protocol/sdk');
  return {
    ...actualSdk,
    KVStoreClient: {
      build: jest.fn().mockImplementation(() =>
        Promise.resolve({
          get: jest.fn().mockResolvedValue(EXPECTED_URL),
        }),
      ),
    },
  };
});

describe('KvStoreGateway', () => {
  let service: KvStoreGateway;
  let configService: EnvironmentConfigService;
  let mockKVStoreClient: any;
  let cacheManager: Cache & { get: jest.Mock; set: jest.Mock };

  beforeEach(async () => {
    configService = {
      rpcUrl: 'https://localhost:8545',
      cacheTtlExchangeOracleUrl: 2137,
    } as any;

    mockKVStoreClient = await KVStoreClient.build(
      new ethers.JsonRpcProvider('test'),
    );
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
          provide: KVStoreClient,
          useValue: mockKVStoreClient,
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
    await service.onModuleInit();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize kvstoreClient', async () => {
      const buildSpy = jest
        .spyOn(KVStoreClient, 'build')
        .mockResolvedValue(mockKVStoreClient);
      await service.onModuleInit();
      expect(buildSpy).toHaveBeenCalledWith(expect.anything());
      expect(service['kvStoreClient']).toBe(mockKVStoreClient);
    });
  });

  describe('getExchangeOracleUrlByAddress', () => {
    it('should get data from kvStoreClient, if not cached', async () => {
      const testAddress = 'testAddress';
      const expectedUrl = EXPECTED_URL;
      mockKVStoreClient.get.mockResolvedValue(expectedUrl);
      cacheManager.get.mockResolvedValue(undefined);
      const result = await service.getExchangeOracleUrlByAddress(testAddress);
      expect(service['kvStoreClient'].get).toHaveBeenCalledWith(
        testAddress,
        KVStoreKeys.url,
      );
      expect(cacheManager.set).toHaveBeenCalledWith(
        service.cachePrefix + testAddress,
        expectedUrl,
        { ttl: configService.cacheTtlExchangeOracleUrl },
      );
      expect(cacheManager.get).toHaveBeenCalledWith(
        service.cachePrefix + testAddress,
      );
      expect(result).toBe(expectedUrl);
    });
    it('should get data from cache, if available', async () => {
      const testAddress = 'testAddress';
      const expectedUrl = EXPECTED_URL;
      cacheManager.get.mockResolvedValue(expectedUrl);
      const result = await service.getExchangeOracleUrlByAddress(testAddress);

      expect(service['kvStoreClient'].get).not.toHaveBeenCalled();
      expect(cacheManager.get).toHaveBeenCalledWith(
        service.cachePrefix + testAddress,
      );
      expect(result).toBe(expectedUrl);
    });
  });
});
