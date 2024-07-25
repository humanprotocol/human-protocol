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
import {
  Authorization,
  JwtPayload,
} from '../../common/config/params-decorators';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { JwtUserData } from '../../common/utils/jwt-token.model';

@Controller()
export class StatisticsController {
  constructor(
    private readonly service: StatisticsService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}
  @ApiTags('Statistics')
  @Get('/stats')
  @ApiOperation({ summary: 'General Oracle Statistics' })
  @UsePipes(new ValidationPipe())
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
  @UsePipes(new ValidationPipe())
  public getUserStatistics(
    @Query() dto: UserStatisticsDto,
    @JwtPayload() payload: JwtUserData,
    @Authorization() token: string,
  ): Promise<UserStatisticsResponse> {
    const command = this.mapper.map(
      dto,
      UserStatisticsDto,
      UserStatisticsCommand,
    );
    command.token = token;
    command.walletAddress = payload.wallet_address;
    return this.service.getUserStats(command);
  }
}
