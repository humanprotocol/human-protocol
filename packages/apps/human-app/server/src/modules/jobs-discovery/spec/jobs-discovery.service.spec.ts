import { ChainId } from '@human-protocol/sdk';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JobsDiscoveryService } from '../jobs-discovery.service';
import { ExchangeOracleGateway } from '../../../integrations/exchange-oracle/exchange-oracle.gateway';
import { Test, TestingModule } from '@nestjs/testing';
import {
  hmtRewardAmountResponseItemFixture,
  invalidRewardAmountResponseItemFixture,
  jobsDiscoveryParamsCommandFixture,
  responseItemsFixture,
  responseItemFixture1,
  responseItemFixture3,
  usdcRewardAmountResponseItemFixture,
  validRewardAmountResponseItemFixture,
} from './jobs-discovery.fixtures';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import {
  JobDiscoveryFieldName,
  JobDiscoverySortField,
  SortOrder,
} from '../../../common/enums/global-common';

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
  describe('processJobsDiscovery', () => {
    it('should get oracle url and call api for jobs fetch', async () => {
      const command = jobsDiscoveryParamsCommandFixture;

      jest
        .spyOn(service as any, 'getCachedJobs')
        .mockReturnValue(responseItemsFixture);

      const result = await service.processJobsDiscovery(command);
      expect(service.getCachedJobs).toHaveBeenCalledWith(
        jobsDiscoveryParamsCommandFixture.oracleAddress,
      );
      expect(result.results).toEqual([
        responseItemFixture3,
        responseItemFixture1,
      ]);
    });

    it('should sort reward amounts using human-readable units', async () => {
      const command = {
        ...jobsDiscoveryParamsCommandFixture,
        data: {
          ...jobsDiscoveryParamsCommandFixture.data,
          fields: [
            JobDiscoveryFieldName.RewardAmount,
            JobDiscoveryFieldName.RewardToken,
          ],
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

      const result = await service.processJobsDiscovery(command);

      expect(result.results).toEqual([
        usdcRewardAmountResponseItemFixture,
        hmtRewardAmountResponseItemFixture,
      ]);
    });

    it('should use zero for invalid reward amounts', async () => {
      const command = {
        ...jobsDiscoveryParamsCommandFixture,
        data: {
          ...jobsDiscoveryParamsCommandFixture.data,
          fields: [
            JobDiscoveryFieldName.RewardAmount,
            JobDiscoveryFieldName.RewardToken,
          ],
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

      const result = await service.processJobsDiscovery(command);

      expect(result.results).toEqual([
        validRewardAmountResponseItemFixture,
        invalidRewardAmountResponseItemFixture,
      ]);
    });
  });
});
