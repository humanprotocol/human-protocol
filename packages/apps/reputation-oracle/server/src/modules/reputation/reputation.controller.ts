import { Controller, Get, Param, Query } from '@nestjs/common';
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

@Public()
@ApiTags('Reputation')
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get()
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
  public async getReputations(
    @Query() query: ReputationGetAllQueryDto,
  ): Promise<ReputationDto[]> {
    const { chainId } = query;
    return this.reputationService.getAllReputations(chainId);
  }

  @Get('/:address')
  @ApiOperation({
    summary: 'Get Reputation by Address',
    description: 'Endpoint to get reputation by address.',
  })
  @ApiParam({
    name: 'address',
    description: 'Address for the reputation query.',
    type: String,
    required: true,
  })
  @ApiQuery({
    name: 'chain_id',
    description: 'Chain ID for filtering the reputation.',
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
    description: 'Not Found. Could not find the requested content.',
  })
  public async getReputation(
    @Param() params: ReputationGetParamsDto,
    @Query() query: ReputationGetQueryDto,
  ): Promise<ReputationDto> {
    const { chainId } = query;
    const { address } = params;

    return this.reputationService.getReputation(chainId, address);
  }
}
