import axios from 'axios';

export const sendSlackMessage = async (network: string) => {
  axios.post(process.env.SLACK_WEBHOOK_URL, {
    text: `Faucet out of balance on ${network}`,
  });
};
