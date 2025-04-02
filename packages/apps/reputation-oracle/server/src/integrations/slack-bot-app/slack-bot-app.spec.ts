import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { SlackBotApp } from './slack-bot-app';
import { faker } from '@faker-js/faker';
import {
  createHttpServiceMock,
  createHttpServiceRequestError,
  createHttpServiceResponse,
} from '../../../test/mock-creators/nest';

const mockHttpService = createHttpServiceMock();

describe('SlackBotApp', () => {
  let slackBotApp: SlackBotApp;

  const config = {
    webhookUrl: faker.internet.url(),
    oauthToken: faker.internet.jwt(),
  };

  beforeAll(async () => {
    await Test.createTestingModule({
      providers: [
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    slackBotApp = new SlackBotApp(
      mockHttpService as unknown as HttpService,
      config,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('sendNotification', () => {
    it('should send a notification successfully', async () => {
      mockHttpService.post.mockReturnValueOnce(createHttpServiceResponse(200));
      const message = { text: 'Test notification' };

      await expect(
        slackBotApp.sendNotification(message),
      ).resolves.not.toThrow();

      expect(mockHttpService.post).toHaveBeenCalledWith(
        config.webhookUrl,
        message,
      );
    });

    it('should throw an error if sending the notification fails', async () => {
      mockHttpService.post.mockReturnValueOnce(
        createHttpServiceRequestError(new Error()),
      );
      await expect(
        slackBotApp.sendNotification({ text: 'Test' }),
      ).rejects.toThrow('Error sending Slack notification');
    });
  });

  describe('openModal', () => {
    it('should open a modal successfully', async () => {
      mockHttpService.post.mockReturnValueOnce(
        createHttpServiceResponse(200, {
          ok: true,
        }),
      );

      const triggerId = faker.word.sample();
      const modalView: any = {
        type: 'modal',
        title: { type: 'plain_text', text: 'Test' },
      };

      await expect(
        slackBotApp.openModal(triggerId, modalView),
      ).resolves.not.toThrow();

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://slack.com/api/views.open',
        {
          trigger_id: triggerId,
          view: modalView,
        },
        {
          headers: {
            Authorization: `Bearer ${config.oauthToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should throw an error if opening the modal fails', async () => {
      mockHttpService.post.mockReturnValueOnce(
        createHttpServiceResponse(200, {
          ok: false,
          error: 'invalid_trigger',
        }),
      );

      const triggerId = faker.word.sample();
      const modalView: any = {
        type: 'modal',
        title: { type: 'plain_text', text: 'Test' },
      };

      await expect(slackBotApp.openModal(triggerId, modalView)).rejects.toThrow(
        'Error opening Slack modal',
      );
    });
  });

  describe('updateMessage', () => {
    it('should update a message successfully', async () => {
      mockHttpService.post.mockReturnValueOnce(createHttpServiceResponse(200));
      const responseUrl = faker.internet.url();
      const text = faker.lorem.sentence();

      await expect(
        slackBotApp.updateMessage(responseUrl, text),
      ).resolves.not.toThrow();

      expect(mockHttpService.post).toHaveBeenCalledWith(responseUrl, { text });
    });

    it('should throw an error if updating the message fails', async () => {
      mockHttpService.post.mockReturnValueOnce(
        createHttpServiceRequestError(new Error()),
      );

      const responseUrl = faker.internet.url();
      const text = faker.lorem.sentence();

      await expect(
        slackBotApp.updateMessage(responseUrl, text),
      ).rejects.toThrow('Error updating Slack message');
    });
  });
});
