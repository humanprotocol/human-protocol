import axios from 'axios';
import { sendSlackNotification } from './slack';

export const MOCK_SLACK_ABUSE_NOTIFICATION_WEBHOOK_URL =
  'https://slack.com/webhook';

jest.mock('axios');
jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('sendSlackNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send Slack notification and return true on success', async () => {
    const mockResponse = { data: 'mockResponseData' };
    (axios.post as jest.Mock).mockResolvedValue(mockResponse);

    const message = 'Test message';
    const result = await sendSlackNotification(
      MOCK_SLACK_ABUSE_NOTIFICATION_WEBHOOK_URL,
      message,
    );

    expect(axios.post).toHaveBeenCalledWith(
      MOCK_SLACK_ABUSE_NOTIFICATION_WEBHOOK_URL,
      {
        text: message,
      },
    );

    expect(result).toBe(true);
  });

  it('should handle error when sending Slack notification and return false', async () => {
    axios.post = jest.fn().mockRejectedValue(new Error('Mock error'));

    const message = 'Test message';
    const result = await sendSlackNotification(
      MOCK_SLACK_ABUSE_NOTIFICATION_WEBHOOK_URL,
      message,
    );

    expect(axios.post).toHaveBeenCalledWith(
      MOCK_SLACK_ABUSE_NOTIFICATION_WEBHOOK_URL,
      {
        text: message,
      },
    );

    expect(result).toBe(false);
  });

  it('should log payload and return true when webhookUrl is empty', async () => {
    const message = 'Test message';
    const result = await sendSlackNotification('', message);

    expect(axios.post).not.toHaveBeenCalled();

    expect(result).toBe(true);
  });

  it('should log payload and return true when webhookUrl is "disabled"', async () => {
    const message = 'Test message';
    const result = await sendSlackNotification('disabled', message);

    expect(axios.post).not.toHaveBeenCalled();

    expect(result).toBe(true);
  });
});
