import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OracleDiscoveryService } from './oracle-discovery.service';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryDto,
  OracleDiscoveryResponse,
} from './model/oracle-discovery.model';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';

@Controller()
export class OracleDiscoveryController {
  constructor(
    private readonly service: OracleDiscoveryService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}
  @ApiTags('Oracle-Discovery')
  @Get('/oracles')
  @ApiOperation({ summary: 'Oracles discovery' })
  @UsePipes(new ValidationPipe())
  public getOracles(
    @Query() dto: OracleDiscoveryDto,
  ): Promise<OracleDiscoveryResponse[]> {
    throw new HttpException('Jobs discovery is disabled', HttpStatus.FORBIDDEN);
    const command = this.mapper.map(
      dto,
      OracleDiscoveryDto,
      OracleDiscoveryCommand,
    );
    return this.service.processOracleDiscovery(command);
  }
}
