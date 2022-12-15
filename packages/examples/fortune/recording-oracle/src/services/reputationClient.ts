import axios from 'axios';
import { convertUrl } from '../utils/url';
import { FortuneEntry } from './storage';

export async function bulkPayout(
  reputationOracleUrl: string,
  escrowAddress: string,
  fortunes: FortuneEntry[]
) {
  // a cron job might check how much annotations are in work
  // if this is full - then just push them to the reputation oracle

  await axios.post(convertUrl(reputationOracleUrl), {
    escrowAddress,
    fortunes,
  });
}
