import { type NavigateFunction } from 'react-router-dom';
import { type Oracle } from '../hooks';
import { shouldNavigateToRegistration } from './should-navigate-to-registration';
import { navigateToRegistrationPage } from './navigate-to-registration-page';
import { isHCaptchaOracle } from './is-hcaptcha-oracle';
import { navigateToHCaptchaPage } from './navigate-to-hcaptcha-page';
import { navigateToOracleJobsPage } from './navigate-to-oracle-jobs-page';

interface RegistrationResult {
  oracle_addresses: string[];
}

interface NavigationConfig {
  oracle: Oracle;
  siteKey?: string | null | undefined;
  navigate: NavigateFunction;
  registrationData?: RegistrationResult;
}

export const handleOracleNavigation = ({
  oracle,
  siteKey = undefined,
  navigate,
  registrationData,
}: NavigationConfig): void => {
  if (shouldNavigateToRegistration(oracle, registrationData)) {
    navigateToRegistrationPage(oracle.address, navigate);
    return;
  }

  if (isHCaptchaOracle(oracle.address)) {
    navigateToHCaptchaPage({ siteKey, navigate });
    return;
  }

  navigateToOracleJobsPage(oracle, navigate);
};
