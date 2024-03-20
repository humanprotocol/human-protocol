import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.auth';
import { GetJobsDto, SolveJobDto } from './job.dto';
import { JobService } from './job.service';
import { RequestWithUser } from '../../common/types/jwt';

@ApiTags('Job')
@Controller('job')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  getJobs(
    @Request() req: RequestWithUser,
    @Query() query: GetJobsDto,
  ): Promise<any> {
    return this.jobService.getJobList(query, req.user.reputationNetwork);
  }

  @Post('solve')
  solveJob(
    @Request() req: RequestWithUser,
    @Body() body: SolveJobDto,
  ): Promise<any> {
    return this.jobService.solveJob(
      body.chainId,
      body.escrowAddress,
      req.user.address,
      body.solution,
    );
  }
}
