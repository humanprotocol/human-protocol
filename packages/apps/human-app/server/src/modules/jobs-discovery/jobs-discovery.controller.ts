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
  GetJobsCommand,
  GetJobsQueryDto,
  GetJobsResponseDto,
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
  @ApiOkResponse({ type: GetJobsResponseDto, description: 'List of jobs' })
  public async getJobs(
    @Query() query: GetJobsQueryDto,
    @Request() req: RequestWithUser,
  ): Promise<GetJobsResponseDto> {
    if (!this.environmentConfigService.jobsDiscoveryFlag) {
      throw new HttpException(
        'Jobs discovery is disabled',
        HttpStatus.FORBIDDEN,
      );
    }

    const getJobsCommand: GetJobsCommand = this.mapper.map(
      query,
      GetJobsQueryDto,
      GetJobsCommand,
    );
    getJobsCommand.data.qualifications = req.user.qualifications;
    return await this.service.getJobs(getJobsCommand);
  }
}
