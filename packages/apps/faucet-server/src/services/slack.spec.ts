import axios from 'axios';
import { sendSlackNotification } from './slack';

export const MOCK_SLACK_WEBHOOK_URL = 'https://slack.com/webhook';

jest.mock('axios');

describe('sendSlackNotification', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should send Slack notification with the provided message', async () => {
    const mockResponse = { data: 'mockResponseData' };
    (axios.post as jest.Mock).mockResolvedValue(mockResponse);
    process.env.SLACK_WEBHOOK_URL = MOCK_SLACK_WEBHOOK_URL;

    const message = 'Test message';
    await sendSlackNotification(message);

    expect(axios.post).toHaveBeenCalledWith(MOCK_SLACK_WEBHOOK_URL, {
      text: message,
    });
  });

  it('should handle error when sending Slack notification', async () => {
    const mockError = new Error('Mock error');
    (axios.post as jest.Mock).mockRejectedValue(mockError);
    process.env.SLACK_WEBHOOK_URL = MOCK_SLACK_WEBHOOK_URL;

    const message = 'Test message';
    await sendSlackNotification(message);

    expect(axios.post).toHaveBeenCalledWith(MOCK_SLACK_WEBHOOK_URL, {
      text: message,
    });
  });

  it('should handle missing slackWebhookUrl', async () => {
    delete process.env.SLACK_WEBHOOK_URL;

    const message = 'Test message';
    await sendSlackNotification(message);

    expect(axios.post).toHaveBeenCalledTimes(0);
  });
});
