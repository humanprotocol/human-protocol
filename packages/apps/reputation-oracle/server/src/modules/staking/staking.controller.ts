import { Controller, Get, Req, UseFilters } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { RequestWithUser } from '@/common/types';

import { StakeSummaryResponseDto } from './staking.dto';
import { StakingControllerErrorsFilter } from './staking.error-filter';
import { StakingService } from './staking.service';

@ApiTags('Staking')
@ApiBearerAuth()
@UseFilters(StakingControllerErrorsFilter)
@Controller('staking')
export class StakingController {
  constructor(private readonly stakingService: StakingService) {}

  @ApiOperation({ summary: 'Retrieve aggregated staking info' })
  @ApiResponse({ status: 200, type: StakeSummaryResponseDto })
  @Get('/summary')
  async getStakeSummary(
    @Req() request: RequestWithUser,
  ): Promise<StakeSummaryResponseDto> {
    return this.stakingService.getStakeSummary(request.user.id);
  }
}
