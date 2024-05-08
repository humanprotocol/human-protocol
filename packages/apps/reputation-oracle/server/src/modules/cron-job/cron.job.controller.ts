import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { CronJobService } from './cron-job.service';
import { CronAuthGuard } from '../../common/guards/cron.auth';

@Public()
@ApiTags('Cron')
@Controller('/cron')
export class CronJobController {
  constructor(private readonly cronJobService: CronJobService) {}

  @Public()
  @Get('/webhook/pending')
  @ApiOperation({
    summary: 'Process Pending Cron Job',
    description: 'Endpoint to process pending cron jobs that triggers payouts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending cron jobs processed successfully',
  })
  @ApiBearerAuth()
  @UseGuards(CronAuthGuard)
  public async processPendingCronJob(): Promise<void> {
    await this.cronJobService.processPendingWebhooks();
    return;
  }

  @Public()
  @Get('/webhook/paid')
  @ApiOperation({
    summary: 'Process Paid Cron Job',
    description:
      'Endpoint to process paid cron jobs that trigger assess reputation scores.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paid cron jobs processed successfully',
  })
  @ApiBearerAuth()
  @UseGuards(CronAuthGuard)
  public async processPaidCronJob(): Promise<void> {
    await this.cronJobService.processPaidWebhooks();
    return;
  }

  @Public()
  @Get('/abuse/pending')
  @ApiOperation({
    summary: 'Process Abuse pending requests',
    description: 'Endpoint to process Abuse pending requests',
  })
  @ApiResponse({
    status: 200,
    description: 'Abuse requests processed successfully',
  })
  @ApiBearerAuth()
  @UseGuards(CronAuthGuard)
  public async processAbuseRequests(): Promise<void> {
    await this.cronJobService.processAbuseRequests();
    return;
  }

  @Public()
  @Get('/abuse/classified')
  @ApiOperation({
    summary: 'Process Abuse classified requests',
    description: 'Endpoint to process Abuse classified requests',
  })
  @ApiResponse({
    status: 200,
    description: 'Abuse requests processed successfully',
  })
  @ApiBearerAuth()
  @UseGuards(CronAuthGuard)
  public async processClassifiedAbuses(): Promise<void> {
    await this.cronJobService.processClassifiedAbuses();
    return;
  }
}
