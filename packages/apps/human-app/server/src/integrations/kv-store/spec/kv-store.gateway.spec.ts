import { Test, TestingModule } from '@nestjs/testing';
import { KVStoreClient, KVStoreKeys } from '@human-protocol/sdk';
import { KvStoreGateway } from '../kv-store-gateway.service';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { ethers } from 'ethers';

jest.mock('@human-protocol/sdk', () => {
  const actualSdk = jest.requireActual('@human-protocol/sdk');
  return {
    ...actualSdk,
    KVStoreClient: {
      build: jest.fn().mockImplementation(() =>
        Promise.resolve({
          get: jest.fn().mockResolvedValue('https://example.com'),
        }),
      ),
    },
  };
});

describe('KvStoreGateway', () => {
  let service: KvStoreGateway;
  let mockEnvironmentConfigService: EnvironmentConfigService;
  let mockKVStoreClient: any;

  beforeEach(async () => {
    mockEnvironmentConfigService = {
      rpcUrl: 'https://localhost:8545',
    } as any;

    mockKVStoreClient = await KVStoreClient.build(
      new ethers.JsonRpcProvider('test'),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KvStoreGateway,
        {
          provide: EnvironmentConfigService,
          useValue: mockEnvironmentConfigService,
        },
        {
          provide: KVStoreClient,
          useValue: mockKVStoreClient,
        },
      ],
    }).compile();
    service = module.get<KvStoreGateway>(KvStoreGateway);
    await service.onModuleInit();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
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
    it('should get data from kvStoreClient', async () => {
      const testAddress = 'testAddress';
      const expectedUrl = 'https://example.com';
      mockKVStoreClient.get.mockResolvedValue(expectedUrl);
      const result = await service.getExchangeOracleUrlByAddress(testAddress);

      expect(service['kvStoreClient'].get).toHaveBeenCalledWith(
        testAddress,
        KVStoreKeys.url,
      );

      expect(result).toBe(expectedUrl);
    });
  });
});
