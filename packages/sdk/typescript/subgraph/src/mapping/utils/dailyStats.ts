import { ethereum } from '@graphprotocol/graph-ts';
import { DailyStatsData } from '../../../generated/schema';
import { ZERO_BI, ONE_DAY } from './number';

export function getDailyStatsData(event: ethereum.Event): DailyStatsData {
  const timestamp = event.block.timestamp.toI32();
  const dayID = timestamp / ONE_DAY;
  const dayStartTimestamp = dayID * ONE_DAY;

  let dailyStatsData = DailyStatsData.load(dayID.toString());
  if (dailyStatsData === null) {
    dailyStatsData = new DailyStatsData(dayID.toString());
    dailyStatsData.timestamp = dayStartTimestamp;
    dailyStatsData.activeWorkers = ZERO_BI;
    dailyStatsData.transactions = ZERO_BI;
    dailyStatsData.uniqueSenders = ZERO_BI;
    dailyStatsData.uniqueReceivers = ZERO_BI;
    dailyStatsData.escrowsLaunched = ZERO_BI;
    dailyStatsData.escrowsCompleted = ZERO_BI;
    dailyStatsData.escrowPayouts = ZERO_BI;
  }
  return dailyStatsData;
}
