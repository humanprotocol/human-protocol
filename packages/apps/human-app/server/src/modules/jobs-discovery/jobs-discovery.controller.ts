import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { JobsDiscoveryService } from './jobs-discovery.service';
import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryParamsDto,
  JobsDiscoveryResponse,
} from './model/jobs-discovery.model';
import { Authorization } from '../../common/config/params-decorators';

@Controller()
export class JobsDiscoveryController {
  constructor(
    private readonly jobsDiscoveryService: JobsDiscoveryService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiTags('Jobs-Discovery')
  @Get('/jobs')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Retrieve a list of filtered available jobs for passed Exchange Oracle url',
  })
  public async getJobs(
    @Query() jobsDiscoveryParamsDto: JobsDiscoveryParamsDto,
    @Authorization() token: string,
  ): Promise<JobsDiscoveryResponse> {
    const jobsDiscoveryParamsCommand: JobsDiscoveryParamsCommand =
      this.mapper.map(
        jobsDiscoveryParamsDto,
        JobsDiscoveryParamsDto,
        JobsDiscoveryParamsCommand,
      );
    jobsDiscoveryParamsCommand.token = token;
    return await this.jobsDiscoveryService.processJobsDiscovery(
      jobsDiscoveryParamsCommand,
    );
  }
}
