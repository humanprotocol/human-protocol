import { HttpService } from '@nestjs/axios';
import { View, ViewsOpenResponse } from '@slack/web-api';
import { IncomingWebhookSendArguments } from '@slack/webhook';
import { firstValueFrom } from 'rxjs';
import logger from '@/logger';
import * as httpUtils from '@/utils/http';

export class SlackBotApp {
  private readonly logger = logger.child({ context: SlackBotApp.name });
  constructor(
    private readonly httpService: HttpService,
    protected readonly config: { webhookUrl: string; oauthToken: string },
  ) {}

  async sendNotification(message: IncomingWebhookSendArguments): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(this.config.webhookUrl, message),
      );
    } catch (error) {
      const formattedError = httpUtils.formatAxiosError(error);
      const errorMessage = 'Error sending Slack notification';
      this.logger.error(errorMessage, {
        error: formattedError,
      });
      throw new Error(errorMessage);
    }
  }

  async openModal(triggerId: string, modalView: View): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<ViewsOpenResponse>(
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
        throw new Error('Error opening Slack modal');
      }
    } catch (error) {
      const formattedError = httpUtils.formatAxiosError(error);
      const errorMessage = 'Error opening Slack modal';
      this.logger.error(errorMessage, {
        error: formattedError,
      });
      throw new Error(errorMessage);
    }
  }

  async updateMessage(responseUrl: string, text: string): Promise<void> {
    try {
      await firstValueFrom(this.httpService.post(responseUrl, { text }));
    } catch (error) {
      const formattedError = httpUtils.formatAxiosError(error);
      const errorMessage = 'Error updating Slack message';
      this.logger.error(errorMessage, {
        error: formattedError,
      });
      throw new Error(errorMessage);
    }
  }
}
