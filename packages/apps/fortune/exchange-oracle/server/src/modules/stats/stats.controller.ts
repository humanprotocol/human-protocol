import { StatsService } from './stats.service';
import { AssignmentStatsDto, OracleStatsDto } from './stats.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.auth';
import { RequestWithUser } from '../../common/types/jwt';
import { Public } from '../../common/decorators';

@ApiTags('Stats')
@Controller('stats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get Oracle Stats',
    description: 'Endpoint to retrieve statistics related to the Oracle.',
  })
  @ApiResponse({
    status: 200,
    description: 'Oracle stats retrieved successfully.',
    type: OracleStatsDto,
  })
  async getOracleStats(): Promise<OracleStatsDto> {
    return this.statsService.getOracleStats();
  }

  @Get('assignment')
  @ApiOperation({
    summary: 'Get Assignment Stats',
    description: 'Endpoint to retrieve statistics related to user assignments.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assignment stats retrieved successfully.',
    type: AssignmentStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid credentials.',
  })
  async getAssignmentStats(
    @Request() req: RequestWithUser,
  ): Promise<AssignmentStatsDto> {
    return this.statsService.getAssignmentStats(req.user.address);
  }
}
