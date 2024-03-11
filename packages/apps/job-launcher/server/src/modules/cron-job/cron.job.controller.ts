import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { CronAuthGuard } from '../../common/guards/cron.auth';
import { CronJobService } from './cron-job.service';

@Public()
@ApiTags('Cron')
@Controller('/cron')
export class CronJobController {
  constructor(private readonly cronJobService: CronJobService) {}

  @ApiOperation({
    summary: 'Launch the cron job to create escrows',
    description: 'Endpoint to launch the cron job to create escrows.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cron job to create escrows launched successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiBearerAuth()
  @UseGuards(CronAuthGuard)
  @Get('/escrow/create')
  public async launchCreateEscrowCronJob(): Promise<void> {
    await this.cronJobService.createEscrowCronJob();
    return;
  }

  @ApiOperation({
    summary: 'Launch the cron job to setup escrows',
    description: 'Endpoint to launch the cron job to setup escrows.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cron job to setup escrows launched successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiBearerAuth()
  @UseGuards(CronAuthGuard)
  @Get('/escrow/setup')
  public async launchSetupEscrowCronJob(): Promise<void> {
    await this.cronJobService.setupEscrowCronJob();
    return;
  }

  @ApiOperation({
    summary: 'Launch the cron job to fund escrows',
    description: 'Endpoint to launch the cron job to fund escrows.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cron job to fund escrows launched successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiBearerAuth()
  @UseGuards(CronAuthGuard)
  @Get('/escrow/fund')
  public async launchFundEscrowCronJob(): Promise<void> {
    await this.cronJobService.fundEscrowCronJob();
    return;
  }

  @ApiOperation({
    summary: 'Cancel cron job',
    description: 'Endpoint to launch cancel cron job.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cron job launched successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiBearerAuth()
  @UseGuards(CronAuthGuard)
  @Get('/escrow/cancel')
  public async cancelCronJob(): Promise<void> {
    await this.cronJobService.cancelCronJob();
    return;
  }

  @ApiOperation({
    summary: 'Process pending webhooks cron job',
    description: 'Endpoint to launch Process pending webhooks cron job.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cron job launched successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input parameters.',
  })
  @ApiBearerAuth()
  @UseGuards(CronAuthGuard)
  @Get('/wehbhook/process')
  public async processPendingWebhooks(): Promise<any> {
    await this.cronJobService.processPendingWebhooks();
    return;
  }
}
