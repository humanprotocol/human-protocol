import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { SlackConfigService } from '../../config/slack-config.service';
import logger from '../../logger';
import { AbuseDecision } from '../abuse/constants';
import { ChainId, EscrowUtils, OperatorUtils } from '@human-protocol/sdk';

@Injectable()
export class SlackService {
  private readonly logger = logger.child({ context: SlackService.name });

  constructor(
    private readonly httpService: HttpService,
    private readonly slackConfigService: SlackConfigService,
  ) {}

  private async sendNotification(message: any): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(this.slackConfigService.webhookUrl, message),
      );
    } catch (error) {
      this.logger.error('Error sending Slack notification:', error);
      throw error;
    }
  }

  private async openModal(triggerId: string, modalView: any): Promise<void> {
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

  async sendAbuseNotification(data: {
    abuseId: number;
    chainId: ChainId;
    escrowAddress: string;
  }): Promise<void> {
    const escrow = await EscrowUtils.getEscrow(
      data.chainId,
      data.escrowAddress,
    );

    const message = {
      text: 'New abuse report received!',
      attachments: [
        {
          title: 'Escrow',
          fields: [
            { title: 'Address', value: data.escrowAddress },
            { title: 'ChainId', value: data.chainId },
            { title: 'Manifest', value: escrow.manifestUrl },
          ],
        },
        {
          fallback: 'Actions',
          title: 'Actions',
          callback_id: data.abuseId,
          color: '#3AA3E3',
          attachment_type: 'default',
          actions: [
            {
              name: 'accept',
              text: 'Slash',
              type: 'button',
              style: 'primary',
              value: AbuseDecision.ACCEPTED,
            },
            {
              name: 'reject',
              text: 'Reject',
              type: 'button',
              style: 'danger',
              value: AbuseDecision.REJECTED,
              confirm: {
                title: 'Cancel abuse',
                text: `Are you sure you want to cancel slash for escrow ${data.escrowAddress}?`,
                ok_text: 'Yes',
                dismiss_text: 'No',
              },
            },
          ],
        },
      ],
    };

    await this.sendNotification(message);
  }

  async sendAbuseReportModal(data: {
    abuseId: number;
    chainId: ChainId;
    escrowAddress: string;
    triggerId: string;
    responseUrl: string;
  }) {
    const escrow = await EscrowUtils.getEscrow(
      data.chainId,
      data.escrowAddress,
    );
    const maxAmount = (
      await OperatorUtils.getOperator(data.chainId, escrow.launcher)
    ).amountStaked;

    const modalView = {
      type: 'modal',
      callback_id: `${data.abuseId}`,
      title: { type: 'plain_text', text: 'Confirm slash' },
      private_metadata: JSON.stringify({ responseUrl: data.responseUrl }),
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `Max amount: ${maxAmount}` },
        },
        {
          type: 'input',
          block_id: 'quantity_input',
          element: {
            action_id: 'quantity',
            type: 'number_input',
            is_decimal_allowed: true,
            min_value: '0',
            max_value: maxAmount,
          },
          label: {
            type: 'plain_text',
            text: 'Please enter the quantity (in HMT):',
          },
        },
      ],
      submit: { type: 'plain_text', text: 'Submit' },
      close: { type: 'plain_text', text: 'Cancel' },
    };

    await this.openModal(data.triggerId, modalView);
  }
}
