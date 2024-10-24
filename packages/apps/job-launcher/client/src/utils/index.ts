import { DASHBOARD_URL } from '../constants';
import { IS_MAINNET } from '../constants/chains';

export const generateDashboardURL = (chainId: number, address: string) => {
  if (!IS_MAINNET) return;
  return `${DASHBOARD_URL}/search/${chainId}/${address}`;
};
