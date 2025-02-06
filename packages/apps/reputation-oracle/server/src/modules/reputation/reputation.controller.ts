import { Controller, Get, Param, Query, UseFilters } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { ReputationService } from './reputation.service';
import {
  ReputationDto,
  ReputationGetAllQueryDto,
  ReputationGetParamsDto,
  ReputationGetQueryDto,
} from './reputation.dto';
import { ReputationErrorFilter } from './reputation.error.filter';

@Public()
@ApiTags('Reputation')
@Controller('reputation')
@UseFilters(ReputationErrorFilter)
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @ApiOperation({
    summary: 'Get All Reputations',
    description: 'Endpoint to get all reputations.',
  })
  @ApiQuery({
    name: 'chain_id',
    description: 'Chain ID for filtering reputations.',
    type: Number,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Reputations retrieved successfully',
    type: ReputationDto,
    isArray: true,
  })
  @Get()
  async getReputations(
    @Query() query: ReputationGetAllQueryDto,
  ): Promise<ReputationDto[]> {
    const { chainId, roles, orderBy, orderDirection, first, skip } = query;
    const reputations = await this.reputationService.getReputations(
      chainId,
      roles,
      orderBy,
      orderDirection,
      first,
      skip,
    );
    return reputations;
  }

  @ApiOperation({
    summary: 'Get reputation by address',
    description: 'Endpoint to get reputation by address',
  })
  @ApiParam({
    name: 'address',
    description: 'Address for the reputation query',
    type: String,
    required: true,
  })
  @ApiQuery({
    name: 'chain_id',
    description: 'Chain ID for filtering the reputation',
    type: Number,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Reputation retrieved successfully',
    type: ReputationDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content',
  })
  /**
   * TODO: Refactor its usages to be part of getAll endpoint
   * where you pass single address and delete this route
   */
  @Get('/:address')
  async getReputation(
    @Param() params: ReputationGetParamsDto,
    @Query() query: ReputationGetQueryDto,
  ): Promise<ReputationDto> {
    const { chainId } = query;
    const { address } = params;

    const reputation = await this.reputationService.getReputation(
      chainId,
      address,
    );
    return reputation;
  }
}
