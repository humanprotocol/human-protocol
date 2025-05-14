import { faker } from '@faker-js/faker';
import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';

import { createHttpServiceMock } from '../../../test/mock-creators/nest';
import { SlackConfigService } from '../../config';

import { AbuseSlackBot } from './abuse-slack-bot';
import { AbuseDecision } from './constants';

const mockHttpService = createHttpServiceMock();

describe('AbuseSlackBot', () => {
  let abuseSlackBot: AbuseSlackBot;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AbuseSlackBot,
        {
          provide: HttpService,
          useValue: mockHttpService,
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
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('sendAbuseNotification', () => {
    let spyOnSendNotification: jest.SpyInstance;

    beforeAll(() => {
      spyOnSendNotification = jest
        .spyOn(abuseSlackBot, 'sendNotification')
        .mockImplementation();
    });

    afterAll(() => {
      spyOnSendNotification.mockRestore();
    });

    it('should send a notification with the correct payload', async () => {
      const abuseId = faker.number.int();
      const chainId = faker.number.int();
      const escrowAddress = faker.finance.ethereumAddress();
      const manifestUrl = faker.internet.url();

      await expect(
        abuseSlackBot.sendAbuseNotification({
          abuseId,
          chainId,
          escrowAddress,
          manifestUrl,
        }),
      ).resolves.not.toThrow();

      expect(spyOnSendNotification).toHaveBeenCalledWith({
        text: 'New abuse report received!',
        attachments: [
          {
            title: 'Escrow',
            fields: [
              { title: 'Address', value: escrowAddress },
              { title: 'ChainId', value: chainId.toString() },
              { title: 'Manifest', value: manifestUrl },
            ],
          },
          {
            fallback: 'Actions',
            title: 'Actions',
            callback_id: abuseId.toString(),
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
                  text: `Are you sure you want to cancel slash for escrow ${escrowAddress}?`,
                  ok_text: 'Yes',
                  dismiss_text: 'No',
                },
              },
            ],
          },
        ],
      });
    });

    it('should throw an error if sending the notification fails', async () => {
      spyOnSendNotification.mockRejectedValueOnce(
        new Error('Error sending Slack notification'),
      );

      await expect(
        abuseSlackBot.sendAbuseNotification({
          abuseId: faker.number.int(),
          chainId: faker.number.int(),
          escrowAddress: faker.finance.ethereumAddress(),
          manifestUrl: faker.internet.url(),
        }),
      ).rejects.toThrow('Error sending Slack notification');
    });
  });

  describe('triggerAbuseReportModal', () => {
    let spyOnOpenModal: jest.SpyInstance;

    beforeAll(() => {
      spyOnOpenModal = jest
        .spyOn(abuseSlackBot, 'openModal')
        .mockImplementation();
    });

    afterAll(() => {
      spyOnOpenModal.mockRestore();
    });

    it('should open a modal with the correct payload', async () => {
      const abuseId = faker.number.int();
      const chainId = faker.number.int();
      const escrowAddress = faker.finance.ethereumAddress();
      const triggerId = faker.string.uuid();
      const responseUrl = faker.internet.url();
      const maxAmount = faker.number.int({ min: 1, max: 1000 });

      await expect(
        abuseSlackBot.triggerAbuseReportModal({
          abuseId,
          chainId,
          escrowAddress,
          maxAmount,
          triggerId,
          responseUrl,
        }),
      ).resolves.not.toThrow();

      expect(spyOnOpenModal).toHaveBeenCalledWith(triggerId, {
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
      });
    });

    it('should throw an error if opening the modal fails', async () => {
      spyOnOpenModal.mockRejectedValueOnce(
        new Error('Error opening Slack modal'),
      );

      await expect(
        abuseSlackBot.triggerAbuseReportModal({
          abuseId: faker.number.int(),
          chainId: faker.number.int(),
          escrowAddress: faker.finance.ethereumAddress(),
          maxAmount: faker.number.int(),
          triggerId: faker.string.uuid(),
          responseUrl: faker.internet.url(),
        }),
      ).rejects.toThrow('Error opening Slack modal');
    });
  });
});
