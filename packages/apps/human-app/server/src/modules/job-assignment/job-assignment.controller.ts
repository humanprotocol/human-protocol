import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  Body,
  Controller,
  Get,
  Post,
  Put,
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

  @Post('/job')
  @ApiOperation({
    summary: 'Request to assign a job to a logged user',
  })
  public async assignJob(
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

  @Get('/job')
  @ApiOperation({
    summary: 'Request to get jobs assigned to a logged user',
  })
  public async getAssignedJobs(
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

  @Post('/resign-job')
  @ApiOperation({
    summary: 'Request to resign from assigment',
  })
  public async resignAssigment(
    @Body() dto: ResignJobDto,
    @Request() req: RequestWithUser,
  ) {
    const command = this.mapper.map(dto, ResignJobDto, ResignJobCommand);
    command.token = req.token;
    return this.service.resignJob(command);
  }

  @Put('/refresh')
  @ApiOperation({
    summary: 'Request to refresh assigments data',
  })
  public async refreshAssigments(
    @Body() dto: RefreshJobDto,
    @Request() req: RequestWithUser,
  ) {
    const command = new JobsFetchParamsCommand();
    command.oracleAddress = dto.oracle_address;
    command.token = req.token;
    return this.service.updateAssignmentsCache(command);
  }
}
