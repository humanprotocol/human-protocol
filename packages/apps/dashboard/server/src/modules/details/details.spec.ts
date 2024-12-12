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
import { LeaderDto } from './dto/leader.dto';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  OperatorUtils: {
    getLeaders: jest.fn(),
  },
}));

describe('DetailsService', () => {
  let service: DetailsService;
  let httpService: HttpService;
  let networkConfig: NetworkConfigService;

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
    networkConfig = module.get<NetworkConfigService>(NetworkConfigService);
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

    const result = await service.getLeaders();

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

    const result = await service.getLeaders();

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
      { address: '0x123', role: 'Job Launcher' },
      { address: '0x456', role: 'Exchange Oracle' },
    ];
    const mockReputations = [
      { address: '0x123', reputation: 'medium' },
      { address: '0x456', reputation: 'hign' },
    ];

    jest
      .spyOn(OperatorUtils, 'getLeaders')
      .mockResolvedValue(mockLeaders as ILeader[]);
    jest
      .spyOn(httpService as any, 'get')
      .mockReturnValue(of({ data: mockReputations }));

    const result = await service.getLeaders(
      ChainId.POLYGON_AMOY,
      LeadersOrderBy.REPUTATION,
      OrderDirection.DESC,
    );

    expect(result[0].address).toBe('0x456');
    expect(result[1].address).toBe('0x123');
  });

  it('should handle errors when fetching reputations', async () => {
    const mockLeaders = [{ address: '0x789', role: 'Recording Oracle' }];

    jest
      .spyOn(OperatorUtils, 'getLeaders')
      .mockResolvedValue(mockLeaders as ILeader[]);
    jest
      .spyOn(httpService, 'get')
      .mockReturnValue(throwError(() => new Error('API error')));

    const result = await service.getLeaders();

    expect(result).toEqual([
      expect.objectContaining({
        address: '0x789',
        role: 'Recording Oracle',
        reputation: 'low',
      }),
    ]);
  });

  it('should support pagination when sorting by reputation', async () => {
    const mockLeaders = [
      { address: '0x111', role: 'Exchange Oracle' },
      { address: '0x222', role: 'Recording Oracle' },
      { address: '0x333', role: 'Job Launcher' },
    ];

    const mockReputations = [
      { address: '0x111', reputation: 'low' },
      { address: '0x222', reputation: 'medium' },
      { address: '0x333', reputation: 'hign' },
    ];

    jest
      .spyOn(OperatorUtils, 'getLeaders')
      .mockResolvedValue(mockLeaders as ILeader[]);
    jest
      .spyOn(httpService as any, 'get')
      .mockReturnValue(of({ data: mockReputations }));

    const result = await service.getLeaders(
      ChainId.POLYGON_AMOY,
      LeadersOrderBy.REPUTATION,
      OrderDirection.DESC,
      1,
      0,
    );

    expect(result.length).toBe(1);
    expect(result[0].address).toBe('0x333');
  });
});
