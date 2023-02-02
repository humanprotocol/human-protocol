import axios from 'axios';
import { IFortuneResults } from 'interfaces/fortunes.js';

export async function sendFortunes(
  reputationOracleUrl: string,
  data: IFortuneResults
) {
  const result = await axios.post(reputationOracleUrl, data);
  console.log(12321, result)

  return result;
}
