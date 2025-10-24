import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequestWithUser } from '../../common/interfaces/jwt';
import { JobAssignmentService } from './job-assignment.service';
import {
  JobAssignmentCommand,
  JobAssignmentDto,
  JobAssignmentResponse,
  JobsFetchParamsCommand,
  JobsFetchParamsDto,
  JobsFetchResponse,
  RefreshJobDto,
  ResignJobCommand,
  ResignJobDto,
} from './model/job-assignment.model';
import { ChainId } from '@human-protocol/sdk';
import axios from 'axios';
import { JobStatus } from '../../common/enums/global-common';

@ApiTags('Job-Assignment')
@ApiBearerAuth()
@Controller('/assignment')
export class JobAssignmentController {
  constructor(
    private readonly service: JobAssignmentService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiOperation({
    summary: 'Request to assign a job to a logged user',
  })
  @HttpCode(200)
  @Post('/job')
  async assignJob(
    @Body() jobAssignmentDto: JobAssignmentDto,
    @Request() req: RequestWithUser,
  ): Promise<JobAssignmentResponse> {
    // Require stake eligibility
    if (!req.user?.stake_eligible) {
      throw new ForbiddenException('Stake requirement not met');
    }
    // TODO: temporal - THIRSTYFI
    if (jobAssignmentDto.escrow_address === 'thirstyfi-task') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (new Date(process.env.THIRSTYFI_TASK_EXPIRATION_DATE!) < new Date()) {
        throw new BadRequestException('Expired task');
      }
      try {
        const { data } = await axios.post<any>(
          `${process.env.THIRSTIFY_EXO}/join`,
          {
            walletAddress: jobAssignmentDto.wallet_address,
            email: req.user.email,
            apiKey: jobAssignmentDto.api_key,
            apiSecret: jobAssignmentDto.api_secret,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.THIRSTIFY_TOKEN}`,
              'Content-Type': 'application/json',
            },
          },
        );

        return {
          assignment_id: data.id,
          escrow_address: 'thirstyfi-task',
          chain_id: ChainId.POLYGON,
          job_type: 'thirstyfi',
          status: 'ACTIVE',
          reward_amount: '5 - 50',
          reward_token: 'USDT',
          created_at: new Date().toISOString(),
          expires_at: process.env.THIRSTYFI_TASK_EXPIRATION_DATE ?? '',
        };
      } catch (error) {
        console.log(error);
        throw new BadRequestException(error.response.data.error);
      }
    }

    const jobAssignmentCommand = this.mapper.map(
      jobAssignmentDto,
      JobAssignmentDto,
      JobAssignmentCommand,
    );
    jobAssignmentCommand.token = req.token;
    return this.service.processJobAssignment(jobAssignmentCommand);
  }

  @ApiOperation({
    summary: 'Request to get jobs assigned to a logged user',
  })
  @Get('/job')
  async getAssignedJobs(
    @Query() jobsAssignmentParamsDto: JobsFetchParamsDto,
    @Request() req: RequestWithUser,
  ): Promise<JobsFetchResponse> {
    // Require stake eligibility
    if (!req.user?.stake_eligible) {
      return {
        page: 0,
        page_size: 1,
        total_pages: 1,
        total_results: 0,
        results: [],
      };
    }
    // TODO: temporal - THIRSTYFI
    if (
      jobsAssignmentParamsDto.oracle_address ===
      process.env.THIRSTYFI_ORACLE_ADDRESS
    ) {
      const { data } = await axios.get<any>(
        `${process.env.THIRSTIFY_EXO}/participant`,
        {
          params: { email: req.user.email },
          headers: { Authorization: `Bearer ${process.env.THIRSTIFY_TOKEN}` },
        },
      );
      return Number(data?.id ?? 0) <= 0
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
                assignment_id: data.id,
                escrow_address: 'thirstyfi-task',
                job_type: 'thirstyfi',
                reward_amount: '5 - 50',
                reward_token: 'USDT',
                status:
                  data.status === 'pending'
                    ? JobStatus.ACTIVE
                    : JobStatus.COMPLETED,
                created_at: new Date().toISOString(),
                expires_at: process.env.THIRSTYFI_TASK_EXPIRATION_DATE,
                url: 'https://thirsty.fi/blog/campaign-human-protocol',
              } as any,
            ],
          };
    }
    const jobsAssignmentParamsCommand = this.mapper.map(
      jobsAssignmentParamsDto,
      JobsFetchParamsDto,
      JobsFetchParamsCommand,
    );
    jobsAssignmentParamsCommand.token = req.token;

    return this.service.processGetAssignedJobs(jobsAssignmentParamsCommand);
  }

  @ApiOperation({
    summary: 'Request to resign from assigment',
  })
  @HttpCode(200)
  @Post('/resign-job')
  async resignAssigment(
    @Body() dto: ResignJobDto,
    @Request() req: RequestWithUser,
  ) {
    // Require stake eligibility
    if (!req.user?.stake_eligible) {
      throw new ForbiddenException('Stake requirement not met');
    }
    const command = this.mapper.map(dto, ResignJobDto, ResignJobCommand);
    command.token = req.token;
    return this.service.resignJob(command);
  }

  @ApiOperation({
    summary: 'Request to refresh assigments data',
  })
  @HttpCode(200)
  @Post('/refresh')
  async refreshAssigments(
    @Body() dto: RefreshJobDto,
    @Request() req: RequestWithUser,
  ) {
    // Require stake eligibility
    if (!req.user?.stake_eligible) {
      throw new ForbiddenException('Stake requirement not met');
    }
    const command = new JobsFetchParamsCommand();
    command.oracleAddress = dto.oracle_address;
    command.token = req.token;
    return this.service.updateAssignmentsCache(command);
  }
}
