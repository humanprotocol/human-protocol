import { BACKOFF_INTERVAL_SECONDS } from '../common/constants';

export function calculateExponentialBackoffMs(
  retriesCount: number,
  intervalSeconds = BACKOFF_INTERVAL_SECONDS,
) {
  return Math.pow(2, retriesCount) * intervalSeconds * 1000;
}
