import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { RequestWithUser } from '../../common/interfaces/jwt';
import { JobsDiscoveryService } from './jobs-discovery.service';
import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryParamsDto,
  JobsDiscoveryResponse,
} from './model/jobs-discovery.model';

@Controller()
@ApiBearerAuth()
@ApiTags('Jobs-Discovery')
export class JobsDiscoveryController {
  constructor(
    private readonly service: JobsDiscoveryService,
    private readonly environmentConfigService: EnvironmentConfigService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @Get('/jobs')
  @ApiOperation({
    summary: 'Retrieve a list of jobs for given Exchange Oracle',
  })
  @ApiOkResponse({ type: JobsDiscoveryResponse, description: 'List of jobs' })
  public async getJobs(
    @Query() jobsDiscoveryParamsDto: JobsDiscoveryParamsDto,
    @Request() req: RequestWithUser,
  ): Promise<JobsDiscoveryResponse> {
    if (!this.environmentConfigService.jobsDiscoveryFlag) {
      throw new HttpException(
        'Jobs discovery is disabled',
        HttpStatus.FORBIDDEN,
      );
    }
    const jobsDiscoveryParamsCommand: JobsDiscoveryParamsCommand =
      this.mapper.map(
        jobsDiscoveryParamsDto,
        JobsDiscoveryParamsDto,
        JobsDiscoveryParamsCommand,
      );
    jobsDiscoveryParamsCommand.token = req.token;
    jobsDiscoveryParamsCommand.data.qualifications = req.user.qualifications;
    return await this.service.processJobsDiscovery(jobsDiscoveryParamsCommand);
  }
}
