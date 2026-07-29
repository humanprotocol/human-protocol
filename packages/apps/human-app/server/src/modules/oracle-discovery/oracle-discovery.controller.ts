import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import {
  GetOraclesResponseItem,
  GetOraclesCommand,
  GetOraclesQuery,
} from './model/oracle-discovery.model';
import { OracleDiscoveryService } from './oracle-discovery.service';
import { JobsDiscoveryService } from '../jobs-discovery/jobs-discovery.service';

@ApiTags('Oracle-Discovery')
@ApiBearerAuth()
@Controller()
export class OracleDiscoveryController {
  constructor(
    private readonly oracleDiscoveryService: OracleDiscoveryService,
    private readonly environmentConfigService: EnvironmentConfigService,
    private readonly jobsDiscoveryService: JobsDiscoveryService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiOperation({ summary: 'Oracles discovery' })
  @ApiOkResponse({
    type: Array<GetOraclesResponseItem>,
    description: 'List of oracles',
  })
  @Header('Cache-Control', 'private, max-age=60')
  @Get('/oracles')
  public async getOracles(
    @Query() query: GetOraclesQuery,
  ): Promise<GetOraclesResponseItem[]> {
    if (!this.environmentConfigService.jobsDiscoveryFlag) {
      throw new HttpException(
        'Oracles discovery is disabled',
        HttpStatus.FORBIDDEN,
      );
    }
    const command = this.mapper.map(query, GetOraclesQuery, GetOraclesCommand);
    const oracles = await this.oracleDiscoveryService.getOracles(command);

    const responseItems: GetOraclesResponseItem[] = [];
    for (const oracle of oracles) {
      const oracleJobs = await this.jobsDiscoveryService.getCachedJobs(
        oracle.address,
      );

      let rewardToken: string;
      let minRewardAmount: number;
      let maxRewardAmount: number;
      if (oracleJobs.length) {
        rewardToken = oracleJobs[0].reward_token;
        minRewardAmount = Number.MAX_VALUE;
        maxRewardAmount = Number.MIN_VALUE;

        for (const oracleJob of oracleJobs) {
          const jobRewardAmount = Number(oracleJob.reward_amount);
          minRewardAmount = Math.min(minRewardAmount, jobRewardAmount);
          maxRewardAmount = Math.max(maxRewardAmount, jobRewardAmount);
        }
      } else {
        rewardToken = 'HMT';
        minRewardAmount = 0;
        maxRewardAmount = 0;
      }

      responseItems.push({
        id: oracle.id,
        address: oracle.address,
        chainId: oracle.chainId,
        role: oracle.role,
        url: oracle.url,
        jobTypes: oracle.jobTypes,
        name: oracle.name,
        nTasks: oracleJobs.length,
        minRewardAmount: minRewardAmount.toString(),
        maxRewardAmount: maxRewardAmount.toString(),
        rewardToken,
      });
    }

    return responseItems;
  }
}
