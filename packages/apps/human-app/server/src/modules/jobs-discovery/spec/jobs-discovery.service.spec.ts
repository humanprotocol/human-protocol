import { ChainId } from '@human-protocol/sdk';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { SortOrder } from '../../../common/enums/global-common';
import { ExchangeOracleGateway } from '../../../integrations/exchange-oracle/exchange-oracle.gateway';
import { JobsDiscoveryService } from '../jobs-discovery.service';
import {
  hmtRewardAmountResponseItemFixture,
  invalidRewardAmountResponseItemFixture,
  getJobsCommandFixture,
  responseItemFixture1,
  responseItemFixture3,
  responseItemsFixture,
  usdcRewardAmountResponseItemFixture,
  validRewardAmountResponseItemFixture,
} from './jobs-discovery.fixtures';
import { JobDiscoverySortField } from '../model/jobs-discovery.model';

describe('JobsDiscoveryService', () => {
  let service: JobsDiscoveryService;
  let exchangeOracleGatewayMock: Partial<ExchangeOracleGateway>;
  let cacheManagerMock: any;

  beforeEach(async () => {
    cacheManagerMock = {
      get: jest.fn(),
      set: jest.fn(),
    };

    exchangeOracleGatewayMock = {
      fetchJobs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsDiscoveryService,
        { provide: ExchangeOracleGateway, useValue: exchangeOracleGatewayMock },
        { provide: CACHE_MANAGER, useValue: cacheManagerMock },
        {
          provide: EnvironmentConfigService,
          useValue: {
            chainIdsEnabled: [ChainId.MAINNET],
          },
        },
      ],
    }).compile();

    service = module.get<JobsDiscoveryService>(JobsDiscoveryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getJobs', () => {
    it('should get oracle url and call api for jobs fetch', async () => {
      const command = getJobsCommandFixture;

      jest
        .spyOn(service as any, 'getCachedJobs')
        .mockReturnValue(responseItemsFixture);

      const result = await service.getJobs(command);

      expect(service.getCachedJobs).toHaveBeenCalledWith(
        getJobsCommandFixture.oracleAddress,
      );
      expect(result.results).toEqual([
        responseItemFixture3,
        responseItemFixture1,
      ]);
    });

    it('should sort reward amounts using human-readable units', async () => {
      const command = {
        ...getJobsCommandFixture,
        data: {
          ...getJobsCommandFixture.data,
          sort: SortOrder.DESC,
          sortField: JobDiscoverySortField.REWARD_AMOUNT,
        },
      };

      jest
        .spyOn(service as any, 'getCachedJobs')
        .mockReturnValue([
          hmtRewardAmountResponseItemFixture,
          usdcRewardAmountResponseItemFixture,
        ]);

      const result = await service.getJobs(command);

      expect(result.results).toEqual([
        usdcRewardAmountResponseItemFixture,
        hmtRewardAmountResponseItemFixture,
      ]);
    });

    it('should use zero for invalid reward amounts', async () => {
      const command = {
        ...getJobsCommandFixture,
        data: {
          ...getJobsCommandFixture.data,
          sort: SortOrder.DESC,
          sortField: JobDiscoverySortField.REWARD_AMOUNT,
        },
      };

      jest
        .spyOn(service as any, 'getCachedJobs')
        .mockReturnValue([
          invalidRewardAmountResponseItemFixture,
          validRewardAmountResponseItemFixture,
        ]);

      const result = await service.getJobs(command);

      expect(result.results).toEqual([
        validRewardAmountResponseItemFixture,
        invalidRewardAmountResponseItemFixture,
      ]);
    });
  });
});
