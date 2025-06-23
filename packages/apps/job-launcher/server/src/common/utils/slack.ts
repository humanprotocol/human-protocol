import axios from 'axios';
import Logger from '@human-protocol/logger';

export async function sendSlackNotification(
  webhookUrl: string,
  message: string,
): Promise<boolean> {
  const logger = Logger.child({
    context: 'Slack',
  });

  const payload = {
    text: message,
  };

  if (!webhookUrl || webhookUrl === 'disabled') {
    return true; // Simulate success to avoid unnecessary errors
  }

  try {
    await axios.post(webhookUrl, payload);
    logger.info('Slack notification sent:', payload);
    return true;
  } catch (e) {
    logger.error('Error sending Slack notification:', e);
    return false;
  }
}
