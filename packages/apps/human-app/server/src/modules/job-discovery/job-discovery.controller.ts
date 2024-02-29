import {
  Body,
  Controller,
  Get,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JobDiscoveryService } from './job-discovery.serivce';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryData,
  OracleDiscoveryDto,
} from './interface/oracle-discovery.interface';

@Controller()
export class JobDiscoveryController {
  constructor(
    private readonly service: JobDiscoveryService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}
  @ApiTags('Oracle-Discovery')
  @Get('/oracles')
  @ApiOperation({ summary: 'Operator signup' })
  @UsePipes(new ValidationPipe())
  public signupOperator(
    @Body() oracleDiscoveryDto: OracleDiscoveryDto,
  ): Promise<OracleDiscoveryData[]> {
    const oracleDiscoveryCommand = this.mapper.map(
      oracleDiscoveryDto,
      OracleDiscoveryDto,
      OracleDiscoveryCommand,
    );
    return this.service.processOracleDiscovery(oracleDiscoveryCommand);
  }
}
