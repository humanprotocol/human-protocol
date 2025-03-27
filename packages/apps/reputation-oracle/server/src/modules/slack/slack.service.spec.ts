import { Test } from '@nestjs/testing';
import { SlackService } from './slack.service';
import { HttpService } from '@nestjs/axios';
import { SlackConfigService } from '../../config/slack-config.service';
import { of, throwError } from 'rxjs';

describe('SlackService', () => {
  let slackService: SlackService;
  let httpService: HttpService;
  let slackConfigService: SlackConfigService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SlackService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: SlackConfigService,
          useValue: { webhookUrl: 'http://example.com', oauthToken: 'token' },
        },
      ],
    }).compile();

    slackService = moduleRef.get<SlackService>(SlackService);
    httpService = moduleRef.get<HttpService>(HttpService);
    slackConfigService = moduleRef.get<SlackConfigService>(SlackConfigService);
  });

  describe('sendNotification', () => {
    it('should send a notification successfully', async () => {
      jest.spyOn(httpService, 'post').mockReturnValue(of({} as any as any));
      await expect(
        slackService.sendNotification({ text: 'Test message' }),
      ).resolves.not.toThrow();
      expect(httpService.post).toHaveBeenCalledWith(
        slackConfigService.webhookUrl,
        { text: 'Test message' },
      );
    });

    it('should throw an error if sending notification fails', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => new Error('Network error')));
      await expect(
        slackService.sendNotification({ text: 'Test message' }),
      ).rejects.toThrow('Network error');
    });
  });

  describe('openModal', () => {
    it('should open a modal successfully', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(of({ data: { ok: true } } as any));
      await expect(
        slackService.openModal('triggerId', { type: 'modal' }),
      ).resolves.not.toThrow();
      expect(httpService.post).toHaveBeenCalledWith(
        'https://slack.com/api/views.open',
        { trigger_id: 'triggerId', view: { type: 'modal' } },
        {
          headers: {
            Authorization: `Bearer ${slackConfigService.oauthToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should throw an error if opening modal fails', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(
          of({ data: { ok: false, error: 'invalid_trigger' } } as any),
        );
      await expect(
        slackService.openModal('triggerId', { type: 'modal' }),
      ).rejects.toThrow('Failed to open Slack modal');
    });
  });

  describe('updateMessage', () => {
    it('should update a message successfully', async () => {
      jest.spyOn(httpService, 'post').mockReturnValue(of({} as any));
      await expect(
        slackService.updateMessage('http://response.url', 'Updated text'),
      ).resolves.not.toThrow();
      expect(httpService.post).toHaveBeenCalledWith('http://response.url', {
        text: 'Updated text',
      });
    });

    it('should throw an error if updating message fails', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockReturnValue(throwError(() => new Error('Network error')));
      await expect(
        slackService.updateMessage('http://response.url', 'Updated text'),
      ).rejects.toThrow('Network error');
    });
  });
});
