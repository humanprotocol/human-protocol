import { ChainId } from '@human-protocol/sdk';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { StakingService } from '../staking/staking.service';
import { UiConfigurationController } from './ui-configuration.controller';

process.env.CHAIN_IDS_ENABLED = '80002,11155111';

describe('UiConfigurationController', () => {
  let controller: UiConfigurationController;
  let stakingServiceMock: Pick<jest.Mocked<StakingService>, 'getStakeConfig'>;

  beforeAll(async () => {
    stakingServiceMock = {
      getStakeConfig: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env',
          isGlobal: true,
        }),
      ],
      providers: [
        EnvironmentConfigService,
        {
          provide: StakingService,
          useValue: stakingServiceMock,
        },
      ],
      controllers: [UiConfigurationController],
    }).compile();

    controller = module.get<UiConfigurationController>(
      UiConfigurationController,
    );
  });

  it('should return proper config', async () => {
    stakingServiceMock.getStakeConfig.mockResolvedValueOnce({
      eligibility_enabled: true,
      min_threshold: Math.random(),
    });

    const result = await controller.getConfig();
    expect(result.chainIdsEnabled).toEqual([
      ChainId.POLYGON_AMOY,
      ChainId.SEPOLIA,
    ]);
    expect(result.stakingEligibilityEnabled).toBe(true);
  });
});
