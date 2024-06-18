import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CronJobService } from './cron-job.service';
import { CronAuthGuard } from '../../common/guards/cron.auth';

@UseGuards(CronAuthGuard)
@ApiTags('Cron')
@Controller('/cron')
export class CronJobController {
  constructor(private readonly cronJobService: CronJobService) {}

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
  @Get('/webhook/process')
  public async processPendingWebhooks(): Promise<void> {
    await this.cronJobService.processPendingWebhooks();
    return;
  }
}
