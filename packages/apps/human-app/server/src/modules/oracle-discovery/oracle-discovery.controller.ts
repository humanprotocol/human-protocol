import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OracleDiscoveryService } from './oracle-discovery.service';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryDto,
  OracleDiscovered,
} from './model/oracle-discovery.model';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';

@Controller()
export class OracleDiscoveryController {
  constructor(
    private readonly service: OracleDiscoveryService,
    private readonly environmentConfigService: EnvironmentConfigService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}
  @ApiTags('Oracle-Discovery')
  @Get('/oracles')
  @ApiOperation({ summary: 'Oracles discovery' })
  @ApiOkResponse({
    type: Array<OracleDiscovered>,
    description: 'List of oracles',
  })
  @UsePipes(new ValidationPipe())
  public async getOracles(
    @Query() dto: OracleDiscoveryDto,
  ): Promise<OracleDiscovered[]> {
    if (!this.environmentConfigService.jobsDiscoveryFlag) {
      throw new HttpException(
        'Oracles discovery is disabled',
        HttpStatus.FORBIDDEN,
      );
    }
    const command = this.mapper.map(
      dto,
      OracleDiscoveryDto,
      OracleDiscoveryCommand,
    );
    return await this.service.processOracleDiscovery(command);
  }
}
