import {
  Body,
  Controller,
  Get, Headers,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
} from './interfaces/job-assignment.interface';

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
  @UsePipes(new ValidationPipe())
  public async assignJob(
    @Body() jobAssignmentDto: JobAssignmentDto,
    @Headers('authorization') token: string,
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
  @ApiOperation({
    summary: 'Request to get a jobs assigned to a logged user',
  })
  public async getAssignedJobs(
    @Query() jobsAssignmentParamsDto: JobsFetchParamsDto,
  ): Promise<JobsFetchResponse> {
    const jobsAssignmentParamsCommand = this.mapper.map(
      jobsAssignmentParamsDto,
      JobsFetchParamsDto,
      JobsFetchParamsCommand,
    );
    return this.jobAssignmentService.processGetAssignedJobs(
      jobsAssignmentParamsCommand,
    );
  }
}
