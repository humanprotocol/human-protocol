import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { CronJobService } from './cron-job.service';

@Public()
@ApiTags('Cron')
@Controller('/cron')
export class CronJobController {
  constructor(private readonly cronJobService: CronJobService) {}

  @Public()
  @Get('/wehbhook/pending')
  @ApiOperation({
    summary: 'Process Pending Cron Job',
    description: 'Endpoint to process pending cron jobs that triggers payouts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending cron jobs processed successfully',
  })
  public async processPendingCronJob(): Promise<void> {
    await this.cronJobService.processPendingWebhooks();
    return;
  }

  @Public()
  @Get('/wehbhook/paid')
  @ApiOperation({
    summary: 'Process Paid Cron Job',
    description:
      'Endpoint to process paid cron jobs that trigger assess reputation scores.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paid cron jobs processed successfully',
  })
  public async processPaidCronJob(): Promise<void> {
    await this.cronJobService.processPaidWebhooks();
    return;
  }
}
