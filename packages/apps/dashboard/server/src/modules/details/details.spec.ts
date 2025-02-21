import { Test, TestingModule } from '@nestjs/testing';
import { DetailsService } from './details.service';
import { HttpService } from '@nestjs/axios';
import { EnvironmentConfigService } from '../../common/config/env-config.service';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import {
  ChainId,
  IOperator,
  OperatorUtils,
  KVStoreUtils,
  OrderDirection,
} from '@human-protocol/sdk';
import { OperatorsOrderBy } from '../../common/enums/operator';

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
              .mockResolvedValue([ChainId.MAINNET]),
          },
        },
        Logger,
      ],
    }).compile();

    service = module.get<DetailsService>(DetailsService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should fetch and return operators with reputations', async () => {
    const mockOperators = [{ address: '0x123', role: 'Reputation Oracle' }];
    const mockReputations = [{ address: '0x123', reputation: 'hign' }];

    jest
      .spyOn(OperatorUtils, 'getOperators')
      .mockResolvedValue(mockOperators as IOperator[]);
    jest
      .spyOn(httpService as any, 'get')
      .mockReturnValue(of({ data: mockReputations }));

    const result = await service.getOperators(ChainId.ALL);

    expect(result).toEqual([
      expect.objectContaining({
        address: '0x123',
        role: 'Reputation Oracle',
        reputation: 'hign',
      }),
    ]);
  });

  it('should handle missing reputation data gracefully', async () => {
    const mockOperators = [{ address: '0x456', role: 'Job Launcher' }];

    jest
      .spyOn(OperatorUtils, 'getOperators')
      .mockResolvedValue(mockOperators as IOperator[]);
    jest.spyOn(httpService as any, 'get').mockReturnValue(of({ data: [] }));

    const result = await service.getOperators(ChainId.ALL);

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
      { address: '0xB', reputation: 'high' },
      { address: '0xC', reputation: 'high' },
      { address: '0xD', reputation: 'medium' },
    ];

    const getOperatorsSpy = jest.spyOn(OperatorUtils, 'getOperators');
    getOperatorsSpy.mockImplementation(async ({ first }) => {
      return mockOperators.slice(0, first) as IOperator[];
    });

    jest
      .spyOn(httpService as any, 'get')
      .mockReturnValue(of({ data: mockReputations }));

    const result = await service.getOperators(ChainId.POLYGON_AMOY, {
      orderBy: OperatorsOrderBy.REPUTATION,
      orderDirection: OrderDirection.DESC,
      first: 5,
    });

    expect(result[0].address).toBe('0xB');
    expect(result[1].address).toBe('0xC');
    expect(result[2].address).toBe('0xD');
    expect(result.length).toBe(5);
    expect(getOperatorsSpy).toBeCalledWith(
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

    const result = await service.getOperators(ChainId.ALL);

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

    const result = await service.getKVStoreData(ChainId.MAINNET, '0x123');

    expect(result).toEqual([
      expect.objectContaining({ key: 'key1', value: 'value1' }),
      expect.objectContaining({ key: 'key2', value: 'value2' }),
    ]);
  });
});
