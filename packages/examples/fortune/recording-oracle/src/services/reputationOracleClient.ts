import axios from 'axios';
import { IFortuneResults } from 'interfaces/fortunes.js';

export async function sendFortunes(
  reputationOracleUrl: string,
  data: IFortuneResults
) {
  const result = await axios.post(reputationOracleUrl, data);

  return result;
}
