import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { Public } from '../../common/decorators';
import { UiConfigResponseDto } from './ui-configuration.dto';
import { StakingService } from '../staking/staking.service';

@Controller()
@Public()
@ApiTags('UI-Configuration')
export class UiConfigurationController {
  constructor(
    private readonly environmentConfigService: EnvironmentConfigService,
    private readonly stakingService: StakingService,
  ) {}

  @ApiOperation({ summary: 'Retrieve UI configuration' })
  @ApiOkResponse({
    type: UiConfigResponseDto,
    description: 'UI Configuration object',
  })
  @Header('Cache-Control', 'public, max-age=600')
  @Get('/ui-config')
  public async getConfig(): Promise<UiConfigResponseDto> {
    const stakingRequirementConfig = await this.stakingService.getStakeConfig();

    return {
      chainIdsEnabled: this.environmentConfigService.chainIdsEnabled,
      stakingEligibilityEnabled: stakingRequirementConfig.eligibility_enabled,
      minThreshold: stakingRequirementConfig.min_threshold,
    };
  }
}
