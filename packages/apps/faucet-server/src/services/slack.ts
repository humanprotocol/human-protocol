import axios from 'axios';

export function sendSlackNotification(message: string): void {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!slackWebhookUrl) {
    console.log('Slack webhook URL is not provided');
    return;
  }

  const payload = {
    text: message,
  };

  axios
    .post(slackWebhookUrl, payload)
    .then(() => {
      console.log('Slack notification sent:', payload);
    })
    .catch((error) => {
      console.log('Error sending Slack notification:', error);
    });
}
