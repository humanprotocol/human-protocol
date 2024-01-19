import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JobService } from './job.service';
import { JobDetailsDto, SolveJobDto, WebhookDto } from './job.dto';
import { SignatureAuthGuard } from '../../common/guards';
import { Role } from '../../common/enums/role';
import { HEADER_SIGNATURE_KEY } from '../../common/constant';

@ApiTags('Job')
@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get('details/:chain_id/:escrow_address')
  getDetails(
    @Param('chain_id') chainId: number,
    @Param('escrow_address') escrowAddress: string,
  ): Promise<JobDetailsDto> {
    return this.jobService.getDetails(chainId, escrowAddress);
  }

  @Get('pending/:chain_id/:worker_address')
  getPendingJobs(
    @Param('chain_id') chainId: number,
    @Param('worker_address') workerAddress: string,
  ): Promise<any> {
    return this.jobService.getPendingJobs(chainId, workerAddress);
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

  @UseGuards(new SignatureAuthGuard([Role.Recording, Role.Reputation]))
  @Patch('invalid-solution')
  invalidJobSolution(
    @Headers(HEADER_SIGNATURE_KEY) _: string,
    @Body() body: WebhookDto,
  ): Promise<any> {
    return this.jobService.processInvalidJobSolution(body);
  }
}
