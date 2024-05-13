import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import {
  OracleStatisticsCommand,
  OracleStatisticsDto,
  OracleStatisticsResponse,
} from './model/oracle-statistics.model';
import {
  UserStatisticsCommand,
  UserStatisticsDto,
  UserStatisticsResponse,
} from './model/user-statistics.model';
import { Authorization } from '../../common/config/params-decorators';

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
      oracleAddress: dto.oracle_address,
    } as OracleStatisticsCommand;
    return this.service.getOracleStats(command);
  }

  @ApiTags('Statistics')
  @Get('stats/assignment')
  @ApiOperation({ summary: 'Statistics for requesting user' })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe())
  public getUserStatistics(
    @Query() dto: UserStatisticsDto,
    @Authorization() token: string,
  ): Promise<UserStatisticsResponse> {
    const command: UserStatisticsCommand = {
      oracleAddress: dto.oracle_address,
      token: token,
    } as UserStatisticsCommand;
    return this.service.getUserStats(command);
  }
}
