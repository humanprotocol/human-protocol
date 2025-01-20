import { type NavigateFunction } from 'react-router-dom';
import { shouldNavigateToRegistration } from '@/modules/worker/components/jobs-discovery/helpers/should-navigate-to-registration';
import { navigateToRegistrationPage } from '@/modules/worker/components/jobs-discovery/helpers/navigate-to-registration-page';
import { isHCaptchaOracle } from '@/modules/worker/components/jobs-discovery/helpers/is-hcaptcha-oracle';
import type { Oracle } from '@/modules/worker/services/oracles';
import { navigateToHCaptchaPage } from '@/modules/worker/components/jobs-discovery/helpers/navigate-to-hcaptcha-page';
import { navigateToOracleJobsPage } from '@/modules/worker/components/jobs-discovery/helpers/navigate-to-oracle-jobs-page';

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
