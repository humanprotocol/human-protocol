import { Logger } from '@nestjs/common';
import axios from 'axios';

export async function sendSlackNotification(
  webhookUrl: string,
  message: string,
): Promise<boolean> {
  const logger = new Logger('Slack');

  const payload = {
    text: message,
  };

  if (!webhookUrl || webhookUrl === 'disabled') {
    logger.log('Slack notification (mocked):', payload);
    return true; // Simulate success to avoid unnecessary errors
  }

  try {
    await axios.post(webhookUrl, payload);
    logger.log('Slack notification sent:', payload);
    return true;
  } catch (e) {
    logger.error('Error sending Slack notification:', e);
    return false;
  }
}
