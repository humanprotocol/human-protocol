import {
  Body,
  Controller,
  Get,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OracleDiscoveryService } from './oracle-discovery.serivce';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryData,
  OracleDiscoveryDto,
} from './interface/oracle-discovery.interface';

@Controller()
export class OracleDiscoveryController {
  logger = new Logger(OracleDiscoveryController.name);
  constructor(
    private readonly service: OracleDiscoveryService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}
  @ApiTags('Oracle-Discovery')
  @Get('/oracles')
  @ApiOperation({ summary: 'Operator signup' })
  @UsePipes(new ValidationPipe())
  public signupOperator(
    @Body() oracleDiscoveryDto: OracleDiscoveryDto,
  ): Promise<OracleDiscoveryData[]> {
    this.logger.log(
      `Oracle Discovery request: { 
        chainId: ${oracleDiscoveryDto.chainId}, 
        address: ${oracleDiscoveryDto.address}, 
        role: ${oracleDiscoveryDto.role}
      }`,
    );
    const oracleDiscoveryCommand = this.mapper.map(
      oracleDiscoveryDto,
      OracleDiscoveryDto,
      OracleDiscoveryCommand,
    );
    return this.service.processOracleDiscovery(oracleDiscoveryCommand);
  }
}
