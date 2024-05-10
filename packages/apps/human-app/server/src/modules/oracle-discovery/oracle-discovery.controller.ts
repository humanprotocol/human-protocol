import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OracleDiscoveryService } from './oracle-discovery.serivce';
import { OracleDiscoveryResponse } from './model/oracle-discovery.model';

@Controller()
export class OracleDiscoveryController {
  constructor(private readonly service: OracleDiscoveryService) {}
  @ApiTags('Oracle-Discovery')
  @Get('/oracles')
  @ApiOperation({ summary: 'Oracles discovery' })
  @UsePipes(new ValidationPipe())
  public getOracles(): Promise<OracleDiscoveryResponse[]> {
    return this.service.processOracleDiscovery();
  }
}
