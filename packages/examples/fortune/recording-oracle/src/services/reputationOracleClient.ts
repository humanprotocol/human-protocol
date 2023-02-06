import axios from 'axios';
import { IFortuneResults } from '../interfaces/fortunes';

export async function sendFortunes(
  reputationOracleUrl: string,
  fortunes: IFortuneResults
) {
  const data = [fortunes];
  try {
    const url = reputationOracleUrl.replace(/\/+$/, '');
    return await axios.post(`${url}/send-fortunes`, data);
  } catch (e) {
    console.log('Reputation Oracle error: ', e);
  }
}
