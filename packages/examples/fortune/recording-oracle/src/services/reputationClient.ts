import axios from 'axios';
import { convertUrl } from '../utils/url';


export async function bulkPayout(reputationOracleUrl: string, escrowAddress: string, fortunes: string) {
    // a cron job might check how much annotations are in work
    // if this is full - then just push them to the reputation oracle

    await axios.post(convertUrl(reputationOracleUrl), {
        escrowAddress,
        fortunes,
    });
}
