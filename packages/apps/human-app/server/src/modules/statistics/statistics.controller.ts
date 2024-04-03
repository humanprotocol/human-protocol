import {
  Controller,
  Get,
  Headers,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import {
  OracleStatisticsCommand,
  OracleStatisticsDto,
  OracleStatisticsResponse,
} from './interfaces/oracle-statistics.interface';
import {
  UserStatisticsCommand,
  UserStatisticsDto,
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
    @Query() dto: OracleStatisticsDto,
  ): Promise<OracleStatisticsResponse> {
    const command = {
      exchangeOracleUrl: dto.exchange_oracle_url,
    } as OracleStatisticsCommand;
    return this.service.getOracleStats(command);
  }

  @ApiTags('Statistics')
  @Get('stats/assignment')
  @ApiOperation({ summary: 'Statistics for requesting user' })
  @UsePipes(new ValidationPipe())
  public getUserStatistics(
    @Query() dto: UserStatisticsDto,
    @Headers('authorization') token: string,
  ): Promise<UserStatisticsResponse> {
    const command: UserStatisticsCommand = {
      exchangeOracleUrl: dto.exchange_oracle_url,
      token: token,
    } as UserStatisticsCommand;
    return this.service.getUserStats(command);
  }
}
