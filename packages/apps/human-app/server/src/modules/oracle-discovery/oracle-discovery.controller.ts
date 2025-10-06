import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Query,
  Request,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { RequestWithUser } from '../../common/interfaces/jwt';
import {
  DiscoveredOracle,
  GetOraclesCommand,
  GetOraclesQuery,
} from './model/oracle-discovery.model';
import { OracleDiscoveryService } from './oracle-discovery.service';
import Environment from '../../common/utils/environment';
import { ChainId } from '@human-protocol/sdk';

@ApiTags('Oracle-Discovery')
@Controller()
export class OracleDiscoveryController {
  constructor(
    private readonly oracleDiscoveryService: OracleDiscoveryService,
    private readonly environmentConfigService: EnvironmentConfigService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiOperation({ summary: 'Oracles discovery' })
  @ApiOkResponse({
    type: Array<DiscoveredOracle>,
    description: 'List of oracles',
  })
  @Header('Cache-Control', 'private, max-age=60')
  @Get('/oracles')
  public async getOracles(
    @Request() req: RequestWithUser,
    @Query() query: GetOraclesQuery,
  ): Promise<DiscoveredOracle[]> {
    if (!this.environmentConfigService.jobsDiscoveryFlag) {
      throw new HttpException(
        'Oracles discovery is disabled',
        HttpStatus.FORBIDDEN,
      );
    }
    const command = this.mapper.map(query, GetOraclesQuery, GetOraclesCommand);
    const oracles = await this.oracleDiscoveryService.getOracles(command);

    // TODO: temporal - THIRSTYFI
    const thisrtyOracle = new DiscoveredOracle({
      id: 'thisrty-oracle',
      address: process.env.THIRSTYFI_ORACLE_ADDRESS ?? '',
      chainId: ChainId.POLYGON,
      stakedAmount: '0' as any,
      lockedAmount: '0' as any,
      lockedUntilTimestamp: '0' as any,
      withdrawnAmount: '0' as any,
      slashedAmount: '0' as any,
      amountJobsProcessed: '0' as any,
      role: 'exchange_oracle',
      url: ' ',
      jobTypes: ['thirstyfi'],
      name: 'ThirstyFi',
      registrationNeeded: false,
      // registrationInstructions: 'https://www.thisrty.com/',
    });
    oracles.push(thisrtyOracle);

    if (!Environment.isProduction()) {
      return oracles;
    }

    const isAudinoAvailableForUser = (req?.user?.qualifications ?? []).includes(
      'audino',
    );

    /**
     * TODO: remove filtering logic when Audino available for everyone
     */
    return oracles.filter((oracle) => {
      const isAudinoOracle = oracle.jobTypes.includes('audio_transcription');

      if (isAudinoOracle) {
        return isAudinoAvailableForUser;
      } else {
        return true;
      }
    });
  }
}
