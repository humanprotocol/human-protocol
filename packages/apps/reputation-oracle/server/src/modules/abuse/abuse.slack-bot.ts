import { ChainId } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { SlackConfigService } from '../../config/slack-config.service';
import { SlackBotApp } from '../../integrations/slack-bot-app/slack-bot-app';
import { AbuseDecision } from './constants';
import { View } from '@slack/web-api';
import { IncomingWebhookSendArguments } from '@slack/webhook';

@Injectable()
export class AbuseSlackBot extends SlackBotApp {
  constructor(
    httpService: HttpService,
    slackConfigService: SlackConfigService,
  ) {
    super(httpService, {
      webhookUrl: slackConfigService.abuseWebhookUrl,
      oauthToken: slackConfigService.abuseOauthToken,
    });
  }

  async sendAbuseNotification(data: {
    abuseId: number;
    chainId: ChainId;
    escrowAddress: string;
    manifestUrl: string;
  }): Promise<void> {
    const message: IncomingWebhookSendArguments = {
      text: 'New abuse report received!',
      attachments: [
        {
          title: 'Escrow',
          fields: [
            { title: 'Address', value: data.escrowAddress },
            { title: 'ChainId', value: data.chainId.toString() },
            { title: 'Manifest', value: data.manifestUrl },
          ],
        },
        {
          fallback: 'Actions',
          title: 'Actions',
          callback_id: data.abuseId.toString(),
          color: '#3AA3E3',
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

  async triggerAbuseReportModal(data: {
    abuseId: number;
    chainId: ChainId;
    escrowAddress: string;
    maxAmount: number;
    triggerId: string;
    responseUrl: string;
  }): Promise<void> {
    const modalView: View = {
      type: 'modal',
      callback_id: `${data.abuseId}`,
      title: { type: 'plain_text', text: 'Confirm slash' },
      private_metadata: JSON.stringify({ responseUrl: data.responseUrl }),
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `Max amount: ${data.maxAmount}` },
        },
        {
          type: 'input',
          block_id: 'quantity_input',
          element: {
            action_id: 'quantity',
            type: 'number_input',
            is_decimal_allowed: true,
            min_value: '0',
            max_value: data.maxAmount.toString(),
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
