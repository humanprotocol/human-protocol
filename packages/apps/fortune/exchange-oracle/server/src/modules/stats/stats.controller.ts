import { StatsService } from './stats.service';
import { AssignmentStatsDto, OracleStatsDto } from './stats.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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
  async getOracleStats(): Promise<OracleStatsDto> {
    return this.statsService.getOracleStats();
  }

  @Get('assignment')
  async getAssignmentStats(
    @Request() req: RequestWithUser,
  ): Promise<AssignmentStatsDto> {
    return this.statsService.getAssignmentStats(req.user.address);
  }
}
