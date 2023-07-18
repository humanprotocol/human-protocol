import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { ReputationService } from './reputation.service';
import {
  ReputationGetAllQueryDto,
  ReputationGetParamsDto,
  ReputationGetQueryDto,
} from './reputation.dto';
import { IReputation } from '../../common/interfaces';

@Public()
@ApiTags('Reputation')
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get()
  public async getReputations(
    @Query() query: ReputationGetAllQueryDto,
  ): Promise<IReputation[]> {
    const { chainId } = query;
    return this.reputationService.getAllReputations(chainId);
  }

  @Get('/:address')
  public async getReputation(
    @Param() params: ReputationGetParamsDto,
    @Query() query: ReputationGetQueryDto,
  ): Promise<IReputation> {
    const { chainId } = query;
    const { address } = params;

    return this.reputationService.getReputation(
      chainId,
      address,
    );
  }
}
