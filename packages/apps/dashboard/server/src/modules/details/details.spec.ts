import { HMToken__factory } from '@human-protocol/core/typechain-types';
import {
  IOperator,
  KVStoreUtils,
  OperatorUtils,
  OrderDirection,
  TransactionUtils,
} from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { EnvironmentConfigService } from '../../common/config/env-config.service';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { OperatorsOrderBy } from '../../common/enums/operator';
import { DetailsService } from './details.service';
import { DevelopmentChainId } from '../../common/constants';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  OperatorUtils: {
    getOperators: jest.fn(),
  },
  KVStoreUtils: {
    getKVStoreData: jest.fn(),
  },
}));

jest.mock('../../common/constants/operator', () => ({
  ...jest.requireActual('../../common/constants/operator'),
  MAX_LEADERS_COUNT: 5,
}));

describe('DetailsService', () => {
  let service: DetailsService;
  let httpService: HttpService;
  let cacheManager: { get: jest.Mock; set: jest.Mock };

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DetailsService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: EnvironmentConfigService,
          useValue: {
            reputationSource: 'http://reputation.api',
          },
        },
        {
          provide: NetworkConfigService,
          useValue: {
            getAvailableNetworks: jest
              .fn()
              .mockResolvedValue([DevelopmentChainId.SEPOLIA]),
            networks: [
              {
                chainId: DevelopmentChainId.SEPOLIA,
                rpcUrl: 'http://localhost:8545',
              },
            ],
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
      ],
    }).compile();

    service = module.get<DetailsService>(DetailsService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should fetch and return operators with reputations', async () => {
    const mockOperators = [{ address: '0x123', role: 'Reputation Oracle' }];
    const mockReputations = [{ address: '0x123', level: 'high' }];

    jest
      .spyOn(OperatorUtils, 'getOperators')
      .mockResolvedValue(mockOperators as IOperator[]);
    jest
      .spyOn(httpService as any, 'get')
      .mockReturnValue(of({ data: mockReputations }));

    const result = await service.getOperators(DevelopmentChainId.POLYGON_AMOY);

    expect(result).toEqual([
      expect.objectContaining({
        address: '0x123',
        role: 'Reputation Oracle',
        reputation: 'high',
      }),
    ]);
  });

  it('should handle missing reputation data gracefully', async () => {
    const mockOperators = [{ address: '0x456', role: 'Job Launcher' }];

    jest
      .spyOn(OperatorUtils, 'getOperators')
      .mockResolvedValue(mockOperators as IOperator[]);
    jest.spyOn(httpService as any, 'get').mockReturnValue(of({ data: [] }));

    const result = await service.getOperators(DevelopmentChainId.BSC_TESTNET);

    expect(result).toEqual([
      expect.objectContaining({
        address: '0x456',
        role: 'Job Launcher',
        reputation: 'low',
      }),
    ]);
  });

  it('should return sorted operators by reputation', async () => {
    const mockOperators = [
      { address: '0xA', role: 'Job Launcher' },
      { address: '0xB', role: 'Exchange Oracle' },
      { address: '0xC', role: 'Exchange Oracle' },
      { address: '0xD', role: 'Exchange Oracle' },
      { address: '0xE', role: 'Recording Oracle' },
    ];
    const mockReputations = [
      { address: '0xB', level: 'high' },
      { address: '0xC', level: 'high' },
      { address: '0xD', level: 'medium' },
    ];

    const getOperatorsSpy = jest.spyOn(OperatorUtils, 'getOperators');
    getOperatorsSpy.mockImplementation(async ({ first }) => {
      return mockOperators.slice(0, first) as IOperator[];
    });

    jest
      .spyOn(httpService as any, 'get')
      .mockReturnValue(of({ data: mockReputations }));

    const result = await service.getOperators(DevelopmentChainId.POLYGON_AMOY, {
      orderBy: OperatorsOrderBy.REPUTATION,
      orderDirection: OrderDirection.DESC,
      first: 5,
    });

    expect(result[0].address).toBe('0xB');
    expect(result[1].address).toBe('0xC');
    expect(result[2].address).toBe('0xD');
    expect(result.length).toBe(5);
    expect(getOperatorsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        first: 5,
      }),
    );
  });

  it('should handle errors when fetching reputations', async () => {
    const mockOperators = [{ address: '0x789', role: 'Recording Oracle' }];

    jest
      .spyOn(OperatorUtils, 'getOperators')
      .mockResolvedValue(mockOperators as IOperator[]);
    jest
      .spyOn(httpService, 'get')
      .mockReturnValue(throwError(() => new Error('API error')));

    const result = await service.getOperators(DevelopmentChainId.BSC_TESTNET);

    expect(result).toEqual([
      expect.objectContaining({
        address: '0x789',
        role: 'Recording Oracle',
        reputation: 'low',
      }),
    ]);
  });

  it('should fetch and return KV store data', async () => {
    const mockKVStoreData = [
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' },
    ];

    jest
      .spyOn(KVStoreUtils, 'getKVStoreData')
      .mockResolvedValue(mockKVStoreData);

    const result = await service.getKVStoreData(
      DevelopmentChainId.SEPOLIA,
      '0x123',
    );

    expect(result).toEqual([
      expect.objectContaining({ key: 'key1', value: 'value1' }),
      expect.objectContaining({ key: 'key2', value: 'value2' }),
    ]);
  });

  it('should format transactions using token decimals and symbol', async () => {
    const walletAddress = '0xA';
    const senderAddress = '0xB';
    const receiverAddress = '0xC';
    const tokenAddress = '0xD';
    const txHash = '0x1';

    const mockTransactions = [
      {
        block: 123n,
        txHash,
        from: senderAddress,
        to: walletAddress,
        timestamp: Date.now(),
        value: 1234567n,
        method: 'bulkTransfer',
        receiver: null,
        escrow: null,
        token: tokenAddress,
        internalTransactions: [
          {
            from: senderAddress,
            to: receiverAddress,
            value: 345678n,
            method: 'transfer',
            receiver: null,
            escrow: null,
            token: tokenAddress,
          },
        ],
      },
    ];

    jest
      .spyOn(TransactionUtils, 'getTransactions')
      .mockResolvedValue(mockTransactions);

    jest.spyOn(service as any, 'getTokenData').mockResolvedValue({
      decimals: 6,
      symbol: 'USDC',
    });

    const result = await service.getTransactions(
      DevelopmentChainId.SEPOLIA,
      walletAddress,
      10,
      0,
    );

    expect(result).toEqual([
      expect.objectContaining({
        value: '1.234567',
        tokenSymbol: 'USDC',
        internalTransactions: [
          expect.objectContaining({
            value: '0.345678',
            tokenSymbol: 'USDC',
          }),
        ],
      }),
    ]);
  });

  it('should omit tokenSymbol when transaction has no token', async () => {
    const walletAddress = '0xA';
    const senderAddress = '0xB';
    const receiverAddress = '0xC';

    const mockTransactions = [
      {
        block: 123n,
        txHash: '0x1',
        from: senderAddress,
        to: walletAddress,
        timestamp: Date.now(),
        value: 1234567n,
        method: 'bulkTransfer',
        receiver: null,
        escrow: null,
        token: null,
        internalTransactions: [
          {
            from: senderAddress,
            to: receiverAddress,
            value: 345678n,
            method: 'transfer',
            receiver: null,
            escrow: null,
            token: null,
          },
        ],
      },
    ];

    jest
      .spyOn(TransactionUtils, 'getTransactions')
      .mockResolvedValue(mockTransactions);

    const result = await service.getTransactions(
      DevelopmentChainId.SEPOLIA,
      walletAddress,
      10,
      0,
    );

    expect(result[0].value).toBe('0.000000000001234567');
    expect(result[0].tokenSymbol).toBeUndefined();
    expect(JSON.parse(JSON.stringify(result[0]))).not.toHaveProperty(
      'tokenSymbol',
    );
    expect(result[0].internalTransactions[0].value).toBe(
      '0.000000000000345678',
    );
    expect(result[0].internalTransactions[0].tokenSymbol).toBeUndefined();
    expect(
      JSON.parse(JSON.stringify(result[0].internalTransactions[0])),
    ).not.toHaveProperty('tokenSymbol');
  });

  it('should throw when token metadata cannot be resolved for a tokenized transaction', async () => {
    const walletAddress = '0xA';
    const senderAddress = '0xB';
    const tokenAddress = '0x000000000000000000000000000000000000000d';

    const mockTransactions = [
      {
        block: 123n,
        txHash: '0x1',
        from: senderAddress,
        to: walletAddress,
        timestamp: Date.now(),
        value: 1234567n,
        method: 'bulkTransfer',
        receiver: null,
        escrow: null,
        token: tokenAddress,
        internalTransactions: [],
      },
    ];

    jest
      .spyOn(TransactionUtils, 'getTransactions')
      .mockResolvedValue(mockTransactions);

    jest
      .spyOn(service as any, 'getTokenData')
      .mockRejectedValue(new Error('Failed to fetch token metadata'));

    await expect(
      service.getTransactions(DevelopmentChainId.SEPOLIA, walletAddress, 10, 0),
    ).rejects.toThrow('Failed to fetch token metadata');
  });

  it('should deduplicate concurrent token metadata fetches and reuse resolved promises', async () => {
    const tokenAddress = '0x000000000000000000000000000000000000000d';
    const provider = (service as any).getProvider(DevelopmentChainId.SEPOLIA);
    const tokenCacheKey = `token:${DevelopmentChainId.SEPOLIA}:${tokenAddress.toLowerCase()}`;

    cacheManager.get.mockResolvedValue(null);

    const decimals = jest.fn().mockImplementation(
      async () =>
        await new Promise<bigint>((resolve) => {
          setTimeout(() => resolve(6n), 5);
        }),
    );
    const symbol = jest.fn().mockResolvedValue('USDC');
    const connectSpy = jest
      .spyOn(HMToken__factory, 'connect')
      .mockReturnValue({ decimals, symbol } as any);

    const first = (service as any).getTokenData(
      provider,
      DevelopmentChainId.SEPOLIA,
      tokenAddress,
    );
    const second = (service as any).getTokenData(
      provider,
      DevelopmentChainId.SEPOLIA,
      tokenAddress,
    );

    const [firstResult, secondResult] = await Promise.all([first, second]);
    const thirdResult = await (service as any).getTokenData(
      provider,
      DevelopmentChainId.SEPOLIA,
      tokenAddress,
    );

    expect(firstResult).toEqual({ decimals: 6, symbol: 'USDC' });
    expect(secondResult).toEqual({ decimals: 6, symbol: 'USDC' });
    expect(thirdResult).toEqual({ decimals: 6, symbol: 'USDC' });
    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(decimals).toHaveBeenCalledTimes(1);
    expect(symbol).toHaveBeenCalledTimes(1);
    expect(cacheManager.get).toHaveBeenCalledTimes(1);
    expect(cacheManager.set).toHaveBeenCalledWith(tokenCacheKey, {
      decimals: 6,
      symbol: 'USDC',
    });
    expect((service as any).tokenData.size).toBe(1);
  });
});
