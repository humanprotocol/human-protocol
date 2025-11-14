import axios from 'axios';

import logger from '../../logger';
import { formatAxiosError } from './http';

const slackLogger = logger.child({ context: 'sendSlackNotification' });

export async function sendSlackNotification(
  webhookUrl: string,
  message: string,
): Promise<boolean> {
  const payload = {
    text: message,
  };

  if (!webhookUrl || webhookUrl === 'disabled') {
    return true; // Simulate success to avoid unnecessary errors
  }

  try {
    await axios.post(webhookUrl, payload);
    slackLogger.debug('Slack notification sent', payload);
    return true;
  } catch (error) {
    slackLogger.error('Error sending Slack notification', {
      error: formatAxiosError(error),
    });
    return false;
  }
}
