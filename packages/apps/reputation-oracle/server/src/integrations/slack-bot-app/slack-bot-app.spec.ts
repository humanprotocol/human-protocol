import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { SlackBotApp } from './slack-bot-app';
import { of, throwError } from 'rxjs';
import { faker } from '@faker-js/faker';

describe('SlackBotApp', () => {
  let slackBotApp: SlackBotApp;
  let httpService: HttpService;

  const config = {
    webhookUrl: faker.internet.url(),
    oauthToken: faker.internet.jwt(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    httpService = moduleRef.get<HttpService>(HttpService);
    slackBotApp = new SlackBotApp(httpService, config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('should send a notification successfully', async () => {
      jest.spyOn(httpService, 'post').mockReturnValue(of({} as any));
      const message = { text: 'Test notification' };

      await expect(
        slackBotApp.sendNotification(config.webhookUrl, message),
      ).resolves.not.toThrow();

      expect(httpService.post).toHaveBeenCalledWith(config.webhookUrl, message);
    });

    it('should throw an error if sending the notification fails', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => new Error('Network error')));

      await expect(
        slackBotApp.sendNotification(config.webhookUrl, { text: 'Test' }),
      ).rejects.toThrow('Network error');
    });
  });

  describe('openModal', () => {
    it('should open a modal successfully', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(of({ data: { ok: true } }) as any);

      const triggerId = faker.word.sample();
      const modalView = {
        type: 'modal',
        title: { type: 'plain_text', text: 'Test' },
      };

      await expect(
        slackBotApp.openModal(triggerId, modalView),
      ).resolves.not.toThrow();

      expect(httpService.post).toHaveBeenCalledWith(
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
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(
          of({ data: { ok: false, error: 'invalid_trigger' } }) as any,
        );

      const triggerId = faker.word.sample();
      const modalView = {
        type: 'modal',
        title: { type: 'plain_text', text: 'Test' },
      };

      await expect(slackBotApp.openModal(triggerId, modalView)).rejects.toThrow(
        'Failed to open Slack modal',
      );
    });
  });

  describe('updateMessage', () => {
    it('should update a message successfully', async () => {
      jest.spyOn(httpService, 'post').mockReturnValue(of({} as any));
      const responseUrl = faker.internet.url();
      const text = faker.lorem.sentence();

      await expect(
        slackBotApp.updateMessage(responseUrl, text),
      ).resolves.not.toThrow();

      expect(httpService.post).toHaveBeenCalledWith(responseUrl, { text });
    });

    it('should throw an error if updating the message fails', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => new Error('Network error')));

      const responseUrl = faker.internet.url();
      const text = faker.lorem.sentence();

      await expect(
        slackBotApp.updateMessage(responseUrl, text),
      ).rejects.toThrow('Network error');
    });
  });
});
