import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { routerPaths } from '@/router/router-paths';
import { shouldNavigateToRegistration } from '../helpers';
import { type Oracle } from '../../services/oracles.service';
import { useGetRegistrationDataInOracles } from './use-get-registration-data-oracles';

export const useSelectOracleNavigation = () => {
  const navigate = useNavigate();
  const { data } = useGetRegistrationDataInOracles();

  const selectOracle = useCallback(
    (oracle: Oracle) => {
      if (shouldNavigateToRegistration(oracle, data)) {
        navigate(
          `${routerPaths.worker.registrationInExchangeOracle}/${oracle.address}`
        );
        return;
      }

      navigate(`${routerPaths.worker.jobs}/${oracle.address}`, {
        state: { oracle },
      });
    },
    [data, navigate]
  );

  return { selectOracle };
};
