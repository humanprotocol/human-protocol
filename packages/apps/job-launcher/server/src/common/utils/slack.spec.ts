import axios from 'axios';
import { sendSlackNotification } from './slack';

export const MOCK_SLACK_ABUSE_NOTIFICATION_WEBHOOK_URL =
  'https://slack.com/webhook';

jest.mock('axios');

describe('sendSlackNotification', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should send Slack notification with the provided message', async () => {
    const mockResponse = { data: 'mockResponseData' };
    (axios.post as jest.Mock).mockResolvedValue(mockResponse);

    const message = 'Test message';
    await sendSlackNotification(
      MOCK_SLACK_ABUSE_NOTIFICATION_WEBHOOK_URL,
      message,
    );

    expect(axios.post).toHaveBeenCalledWith(
      MOCK_SLACK_ABUSE_NOTIFICATION_WEBHOOK_URL,
      {
        text: message,
      },
    );
  });

  it('should handle error when sending Slack notification', async () => {
    const mockError = new Error('Mock error');
    (axios.post as jest.Mock).mockRejectedValue(mockError);

    const message = 'Test message';
    await sendSlackNotification(
      MOCK_SLACK_ABUSE_NOTIFICATION_WEBHOOK_URL,
      message,
    );

    expect(axios.post).toHaveBeenCalledWith(
      MOCK_SLACK_ABUSE_NOTIFICATION_WEBHOOK_URL,
      {
        text: message,
      },
    );
  });
});
