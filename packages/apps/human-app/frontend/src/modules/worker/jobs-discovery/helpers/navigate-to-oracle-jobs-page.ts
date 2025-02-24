import { type NavigateFunction } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { type Oracle } from '../hooks';

export const navigateToOracleJobsPage = (
  oracle: Oracle,
  navigate: NavigateFunction
): void => {
  navigate(`${routerPaths.worker.jobs}/${oracle.address}`, {
    state: { oracle },
  });
};
