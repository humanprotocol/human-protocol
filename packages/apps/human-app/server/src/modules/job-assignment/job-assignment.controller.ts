import {
  Body,
  Controller,
  Get,
  Param,
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
  JobAssignmentCommand,
  JobAssignmentDto,
  JobsAssignmentParamsDto,
  JobAssignmentResponse,
  JobsAssignmentParamsCommand,
  JobsAssignmentResponse,
} from './interfaces/job-assignment.interface';

@Controller()
export class JobAssignmentController {
  constructor(
    private readonly jobAssignmentService: JobAssignmentService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  @ApiTags('Job-Assignment')
  @Post('/:url/assignment')
  @ApiOperation({
    summary: 'Request to assign a job to a logged user',
  })
  @UsePipes(new ValidationPipe())
  public async assignJob(
    @Param('url') url: string,
    @Body() jobAssignmentDto: JobAssignmentDto,
  ): Promise<JobAssignmentResponse> {
    const jobAssignmentCommand = this.mapper.map(
      jobAssignmentDto,
      JobAssignmentDto,
      JobAssignmentCommand,
    );
    return this.jobAssignmentService.processJobAssignment(
      url,
      jobAssignmentCommand,
    );
  }

  @ApiTags('Job-Assignment')
  @Get('/:url/assignment')
  @ApiOperation({
    summary: 'Request to get a jobs assigned to a specific user',
  })
  public async getAssignedJobs(
    @Param('url') url: string,
    @Query() jobsAssignmentParamsDto: JobsAssignmentParamsDto,
  ): Promise<JobsAssignmentResponse> {
    const jobsAssignmentParamsCommand = this.mapper.map(
      jobsAssignmentParamsDto,
      JobsAssignmentParamsDto,
      JobsAssignmentParamsCommand,
    );
    return this.jobAssignmentService.processGettingAssignedJobs(
      url,
      jobsAssignmentParamsCommand,
    );
  }
}
