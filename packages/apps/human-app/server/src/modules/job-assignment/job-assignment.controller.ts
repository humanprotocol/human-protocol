import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Request,
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
    const command = new JobsFetchParamsCommand();
    command.oracleAddress = dto.oracle_address;
    command.token = req.token;
    return this.service.updateAssignmentsCache(command);
  }
}
