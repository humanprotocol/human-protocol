import { Body, Controller, Get, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { OperatorService } from '../user-operator/operator.service';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SignupOperatorCommand, SignupOperatorDto } from '../user-operator/interfaces/operator-registration.interface';
import { string } from 'joi';
import { StatisticsService } from './statistics.service';


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
    @Param('url') oracleUrl: string
  ): Promise<void> {
    const command: OracleStatisticsCommand = this.mapper.map(
      oracleUrl,
      string,
      SignupOperatorCommand,
    );
    return this.service.getOracleStats(command);
  }
}