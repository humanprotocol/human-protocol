import { type NavigateFunction } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';

export const navigateToRegistrationPage = (
  oracleAddress: string,
  navigate: NavigateFunction
): void => {
  navigate(
    `${routerPaths.worker.registrationInExchangeOracle}/${oracleAddress}`
  );
};
