import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { SlackConfigService } from '../../config/slack-config.service';
import { AbuseSlackBot } from './abuse.slack-bot';
import { of, throwError } from 'rxjs';
import { faker } from '@faker-js/faker';
import { AbuseDecision } from './constants';

describe('AbuseSlackBot', () => {
  let abuseSlackBot: AbuseSlackBot;
  let httpService: HttpService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AbuseSlackBot,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: SlackConfigService,
          useValue: {
            abuseWebhookUrl: faker.internet.url(),
            abuseOauthToken: faker.internet.jwt(),
          },
        },
      ],
    }).compile();

    abuseSlackBot = moduleRef.get<AbuseSlackBot>(AbuseSlackBot);
    httpService = moduleRef.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendAbuseNotification', () => {
    it('should send a notification with the correct payload', async () => {
      const abuseId = faker.number.int();
      const chainId = faker.number.int();
      const escrowAddress = faker.finance.ethereumAddress();
      const manifestUrl = faker.internet.url();

      jest.spyOn(httpService, 'post').mockReturnValue(of({} as any));

      await expect(
        abuseSlackBot.sendAbuseNotification({
          abuseId,
          chainId,
          escrowAddress,
          manifestUrl,
        }),
      ).resolves.not.toThrow();

      expect(httpService.post).toHaveBeenCalledWith(
        abuseSlackBot['config'].webhookUrl,
        {
          text: 'New abuse report received!',
          attachments: [
            {
              title: 'Escrow',
              fields: [
                { title: 'Address', value: escrowAddress },
                { title: 'ChainId', value: chainId },
                { title: 'Manifest', value: manifestUrl },
              ],
            },
            {
              fallback: 'Actions',
              title: 'Actions',
              callback_id: abuseId,
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
                    text: `Are you sure you want to cancel slash for escrow ${escrowAddress}?`,
                    ok_text: 'Yes',
                    dismiss_text: 'No',
                  },
                },
              ],
            },
          ],
        },
      );
    });

    it('should throw an error if sending the notification fails', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => new Error('Network error')));

      await expect(
        abuseSlackBot.sendAbuseNotification({
          abuseId: faker.number.int(),
          chainId: faker.number.int(),
          escrowAddress: faker.finance.ethereumAddress(),
          manifestUrl: faker.internet.url(),
        }),
      ).rejects.toThrow('Network error');
    });
  });

  describe('triggerAbuseReportModal', () => {
    it('should open a modal with the correct payload', async () => {
      const abuseId = faker.number.int();
      const chainId = faker.number.int();
      const escrowAddress = faker.finance.ethereumAddress();
      const triggerId = faker.word.sample();
      const responseUrl = faker.internet.url();
      const maxAmount = faker.number.int({ min: 1, max: 1000 });

      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(of({ data: { ok: true } }) as any);

      await expect(
        abuseSlackBot.triggerAbuseReportModal({
          abuseId,
          chainId,
          maxAmount,
          escrowAddress,
          triggerId,
          responseUrl,
        }),
      ).resolves.not.toThrow();

      expect(httpService.post).toHaveBeenCalledWith(
        'https://slack.com/api/views.open',
        {
          trigger_id: triggerId,
          view: {
            type: 'modal',
            callback_id: `${abuseId}`,
            title: { type: 'plain_text', text: 'Confirm slash' },
            private_metadata: JSON.stringify({ responseUrl }),
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
                  max_value: maxAmount.toString(),
                },
                label: {
                  type: 'plain_text',
                  text: 'Please enter the quantity (in HMT):',
                },
              },
            ],
            submit: { type: 'plain_text', text: 'Submit' },
            close: { type: 'plain_text', text: 'Cancel' },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${abuseSlackBot['config'].oauthToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should throw an error if opening the modal fails', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(
          of({ data: { ok: false, error: 'invalid_trigger' } }) as any,
        );

      await expect(
        abuseSlackBot.triggerAbuseReportModal({
          abuseId: faker.number.int(),
          chainId: faker.number.int(),
          escrowAddress: faker.finance.ethereumAddress(),
          maxAmount: faker.number.int(),
          triggerId: faker.word.sample(),
          responseUrl: faker.internet.url(),
        }),
      ).rejects.toThrow('Failed to open Slack modal');
    });
  });
});
