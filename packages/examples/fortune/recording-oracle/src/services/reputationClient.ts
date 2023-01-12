import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";
import { convertUrl } from '../utils/url.ts';

export async function bulkPayout(
  reputationOracleUrl: string,
  escrowAddress: string,
  fortunes: string
) {
  // a cron job might check how much annotations are in work
  // if this is full - then just push them to the reputation oracle

  await axiod.post(convertUrl(reputationOracleUrl), {
    escrowAddress,
    fortunes,
  });
}
