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
import { ChainId } from '@human-protocol/sdk';
import { JobStatus } from '../../common/enums/global-common';
import axios from 'axios';

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
    // TODO: temporar - THIRSTYFI
    if (
      jobsDiscoveryParamsDto.oracle_address ===
      process.env.THIRSTYFI_ORACLE_ADDRESS
    ) {
      let data: any;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (
        !(new Date(process.env.THIRSTYFI_TASK_EXPIRATION_DATE!) < new Date())
      ) {
        const response = await axios.get<any>(
          `${process.env.THIRSTIFY_EXO}/participant`,
          {
            params: { email: req.user.email },
            headers: { Authorization: `Bearer ${process.env.THIRSTIFY_TOKEN}` },
          },
        );
        data = response.data;
      }

      return (data?.id ?? 0 > 0)
        ? {
            page: 0,
            page_size: 1,
            total_pages: 1,
            total_results: 0,
            results: [],
          }
        : {
            page: 0,
            page_size: 1,
            total_pages: 1,
            total_results: 1,
            results: [
              {
                chain_id: ChainId.POLYGON,
                escrow_address: 'thirstyfi-task',
                job_type: 'thirstyfi',
                job_description: 'Check job description at https://thirsty.fi/blog/campaign-human-protocol',
                reward_amount: '5 - 50',
                reward_token: 'USDT',
                status: JobStatus.ACTIVE,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                qualifications: [],
              },
            ],
          };
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
