import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.auth';
import { RequestWithUser } from '../../common/interfaces/jwt';
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
import { StatisticsService } from './statistics.service';

@ApiTags('Statistics')
@Controller()
export class StatisticsController {
  constructor(
    private readonly service: StatisticsService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @Get('/stats')
  @ApiOperation({ summary: 'General Oracle Statistics' })
  public getOracleStatistics(
    @Query() dto: OracleStatisticsDto,
  ): Promise<OracleStatisticsResponse> {
    const command = this.mapper.map(
      dto,
      OracleStatisticsDto,
      OracleStatisticsCommand,
    );
    return this.service.getOracleStats(command);
  }

  @ApiTags('Statistics')
  @Get('stats/assignment')
  @ApiOperation({ summary: 'Statistics for requesting user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  public getUserStatistics(
    @Query() dto: UserStatisticsDto,
    @Request() req: RequestWithUser,
  ): Promise<UserStatisticsResponse> {
    const command = this.mapper.map(
      dto,
      UserStatisticsDto,
      UserStatisticsCommand,
    );
    command.token = req.token;
    command.walletAddress = req.user.wallet_address;
    return this.service.getUserStats(command);
  }
}
