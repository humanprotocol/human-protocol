import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Controller, Get, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestWithUser } from '../../common/interfaces/jwt';
import { StakingService } from './staking.service';
import {
  StakeConfigResponse,
  StakeSummaryResponse,
} from './model/staking.model';

@ApiTags('Staking')
@ApiBearerAuth()
@Controller('/staking')
export class StakingController {
  constructor(
    private readonly service: StakingService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiOperation({ summary: 'Get exchange API keys stake summary' })
  @Get('/summary')
  async getStakeSummary(
    @Request() req: RequestWithUser,
  ): Promise<StakeSummaryResponse> {
    return this.service.getStakeSummary(req.token);
  }

  @ApiOperation({ summary: 'Get staking configuration' })
  @Get('/config')
  async getStakeConfig(
    @Request() req: RequestWithUser,
  ): Promise<StakeConfigResponse> {
    return this.service.getStakeConfig(req.token);
  }
}
