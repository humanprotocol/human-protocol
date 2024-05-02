import axios from 'axios';
import { sendSlackNotification } from './utils';
import { MOCK_SLACK_WEBHOOK_URL } from '../test/constants';

jest.mock('axios');
jest.mock('./config', () => ({
  ConfigService: jest.fn(() => ({
    slackWebhookUrl: MOCK_SLACK_WEBHOOK_URL,
  })),
}));

describe('sendSlackNotification', () => {
  it('should send Slack notification with the provided message', async () => {
    const mockResponse = { data: 'mockResponseData' };
    (axios.post as jest.Mock).mockResolvedValue(mockResponse);

    const message = 'Test message';
    await sendSlackNotification(message);

    expect(axios.post).toHaveBeenCalledWith(MOCK_SLACK_WEBHOOK_URL, {
      text: message,
    });
  });

  it('should handle error when sending Slack notification', async () => {
    const mockError = new Error('Mock error');
    (axios.post as jest.Mock).mockRejectedValue(mockError);

    const message = 'Test message';
    await sendSlackNotification(message);

    expect(axios.post).toHaveBeenCalledWith(MOCK_SLACK_WEBHOOK_URL, {
      text: message,
    });
  });

  it('should handle missing slackWebhookUrl', async () => {
    jest.resetAllMocks();

    jest.mock('./config', () => ({
      ConfigService: jest.fn(() => ({
        slackWebhookUrl: undefined,
      })),
    }));

    const message = 'Test message';
    await sendSlackNotification(message);

    expect(axios.post).toHaveBeenCalledTimes(0);
  });
});
