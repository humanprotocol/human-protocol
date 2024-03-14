import {
  Controller,
  Get,
  Headers,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import {
  OracleStatisticsCommand,
  OracleStatisticsResponse,
} from './interfaces/oracle-statistics.interface';
import {
  UserStatisticsCommand,
  UserStatisticsResponse,
} from './interfaces/user-statistics.interface';

@Controller()
export class StatisticsController {
  constructor(private readonly service: StatisticsService) {}
  @ApiTags('Statistics')
  @Get('/stats')
  @ApiOperation({ summary: 'General Oracle Statistics' })
  @UsePipes(new ValidationPipe())
  public getOracleStatistics(
    @Param('url') oracleUrl: string,
  ): Promise<OracleStatisticsResponse> {
    const command = { oracleUrl: oracleUrl } as OracleStatisticsCommand;
    return this.service.getOracleStats(command);
  }

  @ApiTags('Statistics')
  @Get('stats/assignment')
  @ApiOperation({ summary: 'Statistics for requesting user' })
  @UsePipes(new ValidationPipe())
  public getUserStatistics(
    @Param('url') oracleUrl: string,
    @Headers('authorization') token: string,
  ): Promise<UserStatisticsResponse> {
    const command: UserStatisticsCommand = {
      oracleUrl: oracleUrl,
      token: token,
    } as UserStatisticsCommand;
    return this.service.getUserStats(command);
  }
}
