import axios from 'axios';

export function sendSlackNotification(
  webhookUrl: string,
  message: string,
): void {
  const payload = {
    text: message,
  };

  axios
    .post(webhookUrl, payload)
    .then(() => {
      console.log('Slack notification sent:', payload);
    })
    .catch((error) => {
      console.log('Error sending Slack notification:', error);
    });
}
