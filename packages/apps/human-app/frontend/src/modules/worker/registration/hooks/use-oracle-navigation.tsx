import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { routerPaths } from '@/router/router-paths';

export function useOracleNavigation(oracleAddress: string | undefined) {
  const navigate = useNavigate();

  const navigateToJobs = useCallback(() => {
    navigate(`${routerPaths.worker.jobs}/${oracleAddress ?? ''}`, {
      state: { oracleAddress },
    });
  }, [navigate, oracleAddress]);

  const navigateToDiscovery = useCallback(() => {
    navigate(routerPaths.worker.jobsDiscovery);
  }, [navigate]);

  return { navigateToJobs, navigateToDiscovery };
}
