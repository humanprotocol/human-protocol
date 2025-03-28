import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import logger from '../../logger';

export class SlackBotApp {
  private readonly logger = logger.child({ context: SlackBotApp.name });
  constructor(
    private readonly httpService: HttpService,
    protected readonly config: { webhookUrl: string; oauthToken: string },
  ) {}

  async sendNotification(webhookUrl: string, message: any): Promise<void> {
    try {
      await firstValueFrom(this.httpService.post(webhookUrl, message));
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
              Authorization: `Bearer ${this.config.oauthToken}`,
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
