import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Public } from '@/common/decorators';
import { SortDirection } from '@/common/enums';

import { MAX_REPUTATION_ITEMS_PER_PAGE, ReputationOrderBy } from './constants';
import {
  GetReputationQueryOrderBy,
  GetReputationsQueryDto,
  ReputationResponseDto,
} from './reputation.dto';
import { ReputationService } from './reputation.service';

function mapReputationOrderBy(
  queryOrderBy: GetReputationQueryOrderBy,
): ReputationOrderBy {
  const orderByMap = {
    [GetReputationQueryOrderBy.CREATED_AT]: ReputationOrderBy.CREATED_AT,
    [GetReputationQueryOrderBy.REPUTATION_POINTS]:
      ReputationOrderBy.REPUTATION_POINTS,
  };

  return orderByMap[queryOrderBy];
}

@Public()
@ApiTags('Reputation')
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @ApiOperation({
    summary: 'Get Reputations',
    description: 'Endpoint to get reputations',
  })
  @ApiResponse({
    status: 200,
    description: 'Reputations retrieved successfully',
    type: ReputationResponseDto,
    isArray: true,
  })
  @Get()
  async getReputations(
    @Query() query: GetReputationsQueryDto,
  ): Promise<ReputationResponseDto[]> {
    const {
      chainId,
      address,
      roles,
      orderBy = GetReputationQueryOrderBy.CREATED_AT,
      orderDirection = SortDirection.DESC,
      first = MAX_REPUTATION_ITEMS_PER_PAGE,
      skip,
    } = query;

    const reputations = await this.reputationService.getReputations(
      {
        chainId,
        address,
        types: roles,
      },
      {
        orderBy: mapReputationOrderBy(orderBy),
        orderDirection,
        first,
        skip,
      },
    );

    return reputations;
  }
}
