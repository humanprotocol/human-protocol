import axios from 'axios';
import dotenv from 'dotenv';
import { CustomError } from './errors';
import { ConfigService } from './config';
import path from 'path';

const envPath = path.resolve(
  __dirname,
  '../..',
  process.env.NODE_ENV ? `.env.${process.env.NODE_ENV as string}` : '.env',
);
dotenv.config({ path: envPath });

export function sendSlackNotification(message: string): void {
  const configService = new ConfigService();
  const slackWebhookUrl = configService.slackWebhookUrl;

  if (!slackWebhookUrl) {
    console.log(CustomError.SLACK_WEBHOOK_ERROR);
    return;
  }

  const payload = {
    text: message,
  };

  axios
    .post(slackWebhookUrl, payload)
    .then((response) => {
      console.log('Slack notification sent:', response.data);
    })
    .catch((error) => {
      console.log('Error sending Slack notification:', error);
    });
}

export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
