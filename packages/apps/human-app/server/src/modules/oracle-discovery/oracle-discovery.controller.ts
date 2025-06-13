import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import {
  DiscoveredOracle,
  GetOraclesCommand,
  GetOraclesQuery,
} from './model/oracle-discovery.model';
import { OracleDiscoveryService } from './oracle-discovery.service';

@ApiTags('Oracle-Discovery')
@Controller()
export class OracleDiscoveryController {
  constructor(
    private readonly oracleDiscoveryService: OracleDiscoveryService,
    private readonly environmentConfigService: EnvironmentConfigService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @Get('/oracles')
  @ApiOperation({ summary: 'Oracles discovery' })
  @ApiOkResponse({
    type: Array<DiscoveredOracle>,
    description: 'List of oracles',
  })
  public async getOracles(
    @Query() query: GetOraclesQuery,
  ): Promise<DiscoveredOracle[]> {
    if (!this.environmentConfigService.jobsDiscoveryFlag) {
      throw new HttpException(
        'Oracles discovery is disabled',
        HttpStatus.FORBIDDEN,
      );
    }
    const command = this.mapper.map(query, GetOraclesQuery, GetOraclesCommand);
    return await this.oracleDiscoveryService.getOracles(command);
  }
}
