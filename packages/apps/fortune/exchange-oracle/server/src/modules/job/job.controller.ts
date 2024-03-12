import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JobDetailsDto, SolveJobDto } from './job.dto';
import { JobService } from './job.service';

@ApiTags('Job')
@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get('pending/:chain_id/:worker_address')
  getPendingJobs(
    @Param('chain_id') chainId: number,
    @Param('worker_address') workerAddress: string,
  ): Promise<any> {
    return this.jobService.getPendingJobs(chainId, workerAddress);
  }

  @Get('details/:chain_id/:escrow_address')
  getDetails(
    @Param('chain_id') chainId: number,
    @Param('escrow_address') escrowAddress: string,
  ): Promise<JobDetailsDto> {
    return this.jobService.getDetails(chainId, escrowAddress);
  }

  @Post('solve')
  solveJob(@Body() body: SolveJobDto): Promise<any> {
    return this.jobService.solveJob(
      body.chainId,
      body.escrowAddress,
      body.workerAddress,
      body.solution,
    );
  }
}
