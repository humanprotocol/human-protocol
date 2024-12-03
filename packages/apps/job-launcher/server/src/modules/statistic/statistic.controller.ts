import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { JobStatisticsDto } from './statistic.dto';
import { StatisticService } from './statistic.service';

@ApiTags('Statistics')
@Controller('/statistics')
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @ApiOperation({
    summary: 'Get oracle statistics',
    description: 'Endpoint to get statistics about jobs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Oracle statistics',
    type: JobStatisticsDto,
  })
  @Public()
  @Get()
  async getJobStatistics(): Promise<JobStatisticsDto> {
    return this.statisticService.getAllJobStatistics();
  }
}
