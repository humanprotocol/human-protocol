import axios from 'axios';
import { IFortuneResults } from '../interfaces/fortunes';

export async function sendFortunes(
  reputationOracleUrl: string,
  fortunes: IFortuneResults
) {
  const data = [fortunes]
  try {
    return await axios.post(reputationOracleUrl, data);
  } catch(e) {
    console.log("Reputation Oracle error: ", e)
  }
}
