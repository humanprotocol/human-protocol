import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';
import { JobService } from './job.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('Cron Job')
@Controller('/job/cron')
export class CronJobController {
  constructor(private readonly jobService: JobService) {}

  @ApiOperation({
    summary: 'Launch the cron job to create escrows',
    description: 'Endpoint to launch the cron job to create escrows.',
  })
  @Public()
  @ApiResponse({
    status: 200,
    description: 'Cron job to create escrows launched successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @Get('/create-escrow')
  public async launchCreateEscrowCronJob(): Promise<void> {
    await this.jobService.createEscrowCronJob();
    return;
  }

  @ApiOperation({
    summary: 'Launch the cron job to setup escrows',
    description: 'Endpoint to launch the cron job to setup escrows.',
  })
  @Public()
  @ApiResponse({
    status: 200,
    description: 'Cron job to setup escrows launched successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @Get('/setup-escrow')
  public async launchSetupEscrowCronJob(): Promise<void> {
    await this.jobService.setupEscrowCronJob();
    return;
  }

  @ApiOperation({
    summary: 'Launch the cron job to fund escrows',
    description: 'Endpoint to launch the cron job to fund escrows.',
  })
  @Public()
  @ApiResponse({
    status: 200,
    description: 'Cron job to fund escrows launched successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Could not find the requested content.',
  })
  @Get('/fund-escrow')
  public async launchFundEscrowCronJob(): Promise<void> {
    await this.jobService.fundEscrowCronJob();
    return;
  }
}
