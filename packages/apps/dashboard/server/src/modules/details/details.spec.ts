import { Test, TestingModule } from '@nestjs/testing';
import { DetailsService } from './details.service';
import { HttpService } from '@nestjs/axios';
import { EnvironmentConfigService } from '../../common/config/env-config.service';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import {
  ChainId,
  ILeader,
  OperatorUtils,
  OrderDirection,
} from '@human-protocol/sdk';
import { LeadersOrderBy } from '../../common/enums/leader';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  OperatorUtils: {
    getLeaders: jest.fn(),
  },
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

  it('should fetch and return leaders with reputations', async () => {
    const mockLeaders = [{ address: '0x123', role: 'Reputation Oracle' }];
    const mockReputations = [{ address: '0x123', reputation: 'hign' }];

    jest
      .spyOn(OperatorUtils, 'getLeaders')
      .mockResolvedValue(mockLeaders as ILeader[]);
    jest
      .spyOn(httpService as any, 'get')
      .mockReturnValue(of({ data: mockReputations }));

    const result = await service.getLeaders(ChainId.ALL);

    expect(result).toEqual([
      expect.objectContaining({
        address: '0x123',
        role: 'Reputation Oracle',
        reputation: 'hign',
      }),
    ]);
  });

  it('should handle missing reputation data gracefully', async () => {
    const mockLeaders = [{ address: '0x456', role: 'Job Launcher' }];

    jest
      .spyOn(OperatorUtils, 'getLeaders')
      .mockResolvedValue(mockLeaders as ILeader[]);
    jest.spyOn(httpService as any, 'get').mockReturnValue(of({ data: [] }));

    const result = await service.getLeaders(ChainId.ALL);

    expect(result).toEqual([
      expect.objectContaining({
        address: '0x456',
        role: 'Job Launcher',
        reputation: 'low',
      }),
    ]);
  });

  it('should return sorted leaders by reputation', async () => {
    const mockLeaders = [
      { address: '0xA', role: 'Job Launcher' },
      { address: '0xB', role: 'Exchange Oracle' },
      { address: '0xC', role: 'Exchange Oracle' },
      { address: '0xD', role: 'Exchange Oracle' },
    ];
    const mockReputations = [
      { address: '0xB', reputation: 'hign' },
      { address: '0xC', reputation: 'medium' },
    ];

    jest
      .spyOn(OperatorUtils, 'getLeaders')
      .mockResolvedValue(mockLeaders as ILeader[]);
    jest
      .spyOn(httpService as any, 'get')
      .mockReturnValue(of({ data: mockReputations }));

    const result = await service.getLeaders(ChainId.POLYGON_AMOY, {
      orderBy: LeadersOrderBy.REPUTATION,
      orderDirection: OrderDirection.DESC,
    });

    expect(result[0].address).toBe('0xB');
    expect(result[1].address).toBe('0xC');
  });

  it('should handle errors when fetching reputations', async () => {
    const mockLeaders = [{ address: '0x789', role: 'Recording Oracle' }];

    jest
      .spyOn(OperatorUtils, 'getLeaders')
      .mockResolvedValue(mockLeaders as ILeader[]);
    jest
      .spyOn(httpService, 'get')
      .mockReturnValue(throwError(() => new Error('API error')));

    const result = await service.getLeaders(ChainId.ALL);

    expect(result).toEqual([
      expect.objectContaining({
        address: '0x789',
        role: 'Recording Oracle',
        reputation: 'low',
      }),
    ]);
  });
});
