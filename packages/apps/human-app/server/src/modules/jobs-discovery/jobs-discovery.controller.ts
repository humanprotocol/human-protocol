import {
  Controller,
  Get,
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
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { JobsDiscoveryService } from './jobs-discovery.service';
import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryParamsDto,
  JobsDiscoveryResponse,
} from './model/jobs-discovery.model';
import {
  Authorization,
  JwtPayload,
} from '../../common/config/params-decorators';
import { JwtUserData } from '../../common/utils/jwt-token.model';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';

@Controller()
@ApiTags('Jobs-Discovery')
export class JobsDiscoveryController {
  constructor(
    private readonly service: JobsDiscoveryService,
    private readonly environmentConfigService: EnvironmentConfigService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @Get('/jobs')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retrieve a list of jobs for given Exchange Oracle',
  })
  @ApiOkResponse({ type: JobsDiscoveryResponse, description: 'List of jobs' })
  public async getJobs(
    @Query() jobsDiscoveryParamsDto: JobsDiscoveryParamsDto,
    @JwtPayload() jwtPayload: JwtUserData,
    @Authorization() token: string,
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
    jobsDiscoveryParamsCommand.token = token;
    jobsDiscoveryParamsCommand.data.qualifications = jwtPayload.qualifications;
    return await this.service.processJobsDiscovery(jobsDiscoveryParamsCommand);
  }
}
