import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { SlackConfigService } from '../../config/slack-config.service';
import logger from '../../logger';

@Injectable()
export class SlackService {
  private readonly logger = logger.child({ context: SlackService.name });

  constructor(
    private readonly httpService: HttpService,
    private readonly slackConfigService: SlackConfigService,
  ) {}

  async sendNotification(message: any): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(this.slackConfigService.webhookUrl, message),
      );
    } catch (error) {
      this.logger.error('Error sending Slack notification:', error);
      throw error;
    }
  }

  async openModal(triggerId: string, modalView: any): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://slack.com/api/views.open',
          {
            trigger_id: triggerId,
            view: modalView,
          },
          {
            headers: {
              Authorization: `Bearer ${this.slackConfigService.oauthToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (!response.data.ok) {
        this.logger.error('Error opening Slack modal:', response.data);
        throw new Error('Failed to open Slack modal');
      }
    } catch (error) {
      this.logger.error('Error opening Slack modal:', error);
      throw error;
    }
  }

  async updateMessage(responseUrl: string, text: string): Promise<void> {
    try {
      await firstValueFrom(this.httpService.post(responseUrl, { text }));
    } catch (error) {
      this.logger.error('Error updating Slack message:', error);
      throw error;
    }
  }
}
