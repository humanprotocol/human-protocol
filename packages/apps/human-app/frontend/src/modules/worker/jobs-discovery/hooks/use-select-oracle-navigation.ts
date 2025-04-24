import { useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { routerPaths } from '@/router/router-paths';
import { shouldNavigateToRegistration, isHCaptchaOracle } from '../helpers';
import { type Oracle } from '../../services/oracles.service';
import { useGetRegistrationDataInOracles } from './use-get-registration-data-oracles';

const getHCaptchaPagePath = (siteKey: string | null | undefined): string =>
  siteKey
    ? routerPaths.worker.HcaptchaLabeling
    : routerPaths.worker.enableLabeler;

export const useSelectOracleNavigation = () => {
  const navigate = useNavigate();
  const { user } = useAuthenticatedUser();
  const { data } = useGetRegistrationDataInOracles();

  const hCaptchaPagePath = useMemo(
    () => getHCaptchaPagePath(user.site_key),
    [user.site_key]
  );

  const selectOracle = useCallback(
    (oracle: Oracle) => {
      if (shouldNavigateToRegistration(oracle, data)) {
        navigate(
          `${routerPaths.worker.registrationInExchangeOracle}/${oracle.address}`
        );
        return;
      }

      if (isHCaptchaOracle(oracle.address)) {
        navigate(hCaptchaPagePath);
        return;
      }

      navigate(`${routerPaths.worker.jobs}/${oracle.address}`, {
        state: { oracle },
      });
    },
    [data, navigate, hCaptchaPagePath]
  );

  return { selectOracle };
};
