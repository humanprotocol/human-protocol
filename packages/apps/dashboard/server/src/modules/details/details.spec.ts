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

  beforeEach(async () => {
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
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
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
    jest.spyOn(TransactionUtils, 'getTransactions').mockResolvedValue([
      {
        block: 123n,
        txHash: '0x',
        from: '0x1230000000000000000000000000000000000000',
        to: '0x9990000000000000000000000000000000000000',
        timestamp: Date.now(),
        value: 1234567n,
        method: 'bulkTransfer',
        receiver: null,
        escrow: null,
        token: '0x1111111111111111111111111111111111111111',
        internalTransactions: [
          {
            from: '0x1230000000000000000000000000000000000000',
            to: '0x4560000000000000000000000000000000000000',
            value: 345678n,
            method: 'transfer',
            receiver: null,
            escrow: null,
            token: '0x1111111111111111111111111111111111111111',
          },
        ],
      },
    ]);

    jest.spyOn(service as any, 'getTokenData').mockResolvedValue({
      decimals: 6,
      symbol: 'USDC',
    });

    const result = await service.getTransactions(
      DevelopmentChainId.SEPOLIA,
      '0x9990000000000000000000000000000000000000',
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
});
