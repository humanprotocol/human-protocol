import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { JobAssignmentService } from './job-assignment.service';
import {
  JobAssignmentDto,
  JobAssignmentCommand,
  JobAssignmentResponse,
  JobsFetchParamsDto,
  JobsFetchParamsCommand,
  JobsFetchResponse,
} from './model/job-assignment.model';
import { Authorization } from '../../common/config/params-decorators';

@Controller()
export class JobAssignmentController {
  constructor(
    private readonly jobAssignmentService: JobAssignmentService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiTags('Job-Assignment')
  @Post('/assignment/job')
  @ApiOperation({
    summary: 'Request to assign a job to a logged user',
  })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe())
  public async assignJob(
    @Body() jobAssignmentDto: JobAssignmentDto,
    @Authorization() token: string,
  ): Promise<JobAssignmentResponse> {
    const jobAssignmentCommand = this.mapper.map(
      jobAssignmentDto,
      JobAssignmentDto,
      JobAssignmentCommand,
    );
    jobAssignmentCommand.token = token;
    return this.jobAssignmentService.processJobAssignment(jobAssignmentCommand);
  }

  @ApiTags('Job-Assignment')
  @Get('/assignment/job')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Request to get a jobs assigned to a logged user',
  })
  public async getAssignedJobs(
    @Query() jobsAssignmentParamsDto: JobsFetchParamsDto,
    @Authorization() token: string,
  ): Promise<JobsFetchResponse> {
    const jobsAssignmentParamsCommand = this.mapper.map(
      jobsAssignmentParamsDto,
      JobsFetchParamsDto,
      JobsFetchParamsCommand,
    );
    jobsAssignmentParamsCommand.token = token;
    return this.jobAssignmentService.processGetAssignedJobs(
      jobsAssignmentParamsCommand,
    );
  }
}
