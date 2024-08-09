import { Test, TestingModule } from '@nestjs/testing';
import { KvStoreGateway } from '../kv-store.gateway';
import { KVStoreClient, KVStoreKeys } from '@human-protocol/sdk';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { ethers } from 'ethers';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  ORACLE_REGISTRATION_NEEDED_CACHE_KEY,
  ORACLE_URL_CACHE_KEY,
} from '../../../common/constants/cache';

const EXPECTED_URL = 'https://example.com';
const EXPECTED_FLAG = 'true';
jest.mock('@human-protocol/sdk', () => {
  const actualSdk = jest.requireActual('@human-protocol/sdk');
  return {
    ...actualSdk,
    KVStoreClient: {
      build: jest.fn().mockImplementation(() =>
        Promise.resolve({
          get: jest
            .fn()
            .mockResolvedValueOnce(EXPECTED_FLAG)
            .mockResolvedValueOnce(EXPECTED_URL),
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

  describe('getExchangeOracleRegistrationNeeded', () => {
    const testAddress = 'testAddress';
    const cacheKey = `${ORACLE_REGISTRATION_NEEDED_CACHE_KEY}:${testAddress}`;
    it('should get data from kvStoreClient, if not cached', async () => {
      const expectedData = EXPECTED_FLAG;
      mockKVStoreClient.get.mockResolvedValue(expectedData);
      cacheManager.get.mockResolvedValue(undefined);
      const result =
        await service.getExchangeOracleRegistrationNeeded(testAddress);
      expect(service['kvStoreClient'].get).toHaveBeenCalledWith(
        testAddress,
        KVStoreKeys.registrationNeeded,
      );

      expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, expectedData, {
        ttl: configService.cacheTtlExchangeOracleRegistrationNeeded,
      });
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toBe(true);
    });
    it('should get data from cache, if available', async () => {
      const expectedData = EXPECTED_FLAG;
      cacheManager.get.mockResolvedValue(expectedData.toString());
      const result =
        await service.getExchangeOracleRegistrationNeeded(testAddress);

      expect(service['kvStoreClient'].get).not.toHaveBeenCalled();
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toBe(true);
    });
  });

  describe('getExchangeOracleUrlByAddress', () => {
    const testAddress = 'testAddress';
    const cacheKey = `${ORACLE_URL_CACHE_KEY}:${testAddress}`;
    it('should get data from kvStoreClient, if not cached', async () => {
      const expectedData = EXPECTED_URL;
      mockKVStoreClient.get.mockResolvedValue(expectedData);
      cacheManager.get.mockResolvedValue(undefined);
      const result = await service.getExchangeOracleUrlByAddress(testAddress);
      expect(service['kvStoreClient'].get).toHaveBeenCalledWith(
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
      const expectedData = EXPECTED_URL;
      cacheManager.get.mockResolvedValue(expectedData);
      const result = await service.getExchangeOracleUrlByAddress(testAddress);

      expect(service['kvStoreClient'].get).not.toHaveBeenCalled();
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toBe(expectedData);
    });
  });
});
