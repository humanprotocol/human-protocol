import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { ReputationLevel } from '../../common/enums';
import { ReputationService } from './reputation.service';
import { ChainId } from '@human-protocol/sdk';
import {
  ReputationGetAllQueryDto,
  ReputationGetParamsDto,
  ReputationGetQueryDto,
} from './reputation.dto';

@Public()
@ApiTags('Reputation')
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get()
  public async getReputations(
    @Query() query: ReputationGetAllQueryDto,
  ): Promise<
    Array<{ chainId: ChainId; address: string; reputation: ReputationLevel }>
  > {
    const { chainId } = query;
    const reputations = await this.reputationService.getAllReputations(chainId);

    return reputations.map((reputation) => ({
      chainId: reputation.chainId,
      address: reputation.address,
      reputation: this.reputationService.getReputationLevel(
        reputation.reputationPoints,
      ),
    }));
  }

  @Get(':address')
  public async getReputation(
    @Param() params: ReputationGetParamsDto,
    @Query() query: ReputationGetQueryDto,
  ): Promise<ReputationLevel> {
    const { chainId } = query;
    const { address } = params;

    const reputation = await this.reputationService.getReputation(
      chainId,
      address,
    );
    return this.reputationService.getReputationLevel(
      reputation.reputationPoints,
    );
  }
}
