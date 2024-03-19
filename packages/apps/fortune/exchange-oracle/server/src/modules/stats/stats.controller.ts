import { StatsService } from './stats.service';
import { StatsDto } from './stats.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.auth';
import { RequestWithUser } from '../../common/types/jwt';

@ApiTags('Stats')
@Controller('stats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('assignment')
  async getAssignmentStats(@Request() req: RequestWithUser): Promise<StatsDto> {
    return this.statsService.getAssignmentStats(req.user.address);
  }
}
