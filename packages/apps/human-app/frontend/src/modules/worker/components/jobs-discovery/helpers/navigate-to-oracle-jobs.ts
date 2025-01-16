import { type NavigateFunction } from 'react-router-dom';
import type { Oracle } from '@/modules/worker/services/oracles';
import { routerPaths } from '@/router/router-paths';

export const navigateToOracleJobs = (
  oracle: Oracle,
  navigate: NavigateFunction
): void => {
  navigate(`${routerPaths.worker.jobs}/${oracle.address}`, {
    state: { oracle },
  });
};
