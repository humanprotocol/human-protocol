import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller()
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}
  @ApiTags('Statistics')
  @Get('/statistics')
  @ApiOperation({ summary: 'Oracle statistics' })
  @UsePipes(new ValidationPipe())
  public getOracleStatistics(): Promise<void> {
}