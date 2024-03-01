import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { JobsDiscoveryService } from './jobs-discovery.service';
import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryParamsDto,
  JobsDiscoveryResponse,
} from './interfaces/jobs-discovery.interface';

@Controller()
export class JobsDiscoveryController {
  constructor(
    private readonly jobsDiscoveryService: JobsDiscoveryService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiTags('Jobs-Discovery')
  @Get('/:url/jobs')
  @ApiOperation({
    summary:
      'Retrieve a list of filtered available jobs for all Exchange Oracles',
  })
  public async discoverJobs(
    @Param('url') url: string,
    @Query() jobsDiscoveryParamsDto: JobsDiscoveryParamsDto,
  ): Promise<JobsDiscoveryResponse> {
    const jobsDiscoveryParamsCommand = this.mapper.map(
      jobsDiscoveryParamsDto,
      JobsDiscoveryParamsDto,
      JobsDiscoveryParamsCommand,
    );
    return await this.jobsDiscoveryService.processJobsDiscovery(
      url,
      jobsDiscoveryParamsCommand,
    );
  }
}
