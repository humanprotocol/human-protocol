import { type NavigateFunction } from 'react-router-dom';
import { shouldNavigateToRegistration } from '@/modules/worker/components/jobs-discovery/helpers/should-navigate-to-registration';
import { navigateToRegistration } from '@/modules/worker/components/jobs-discovery/helpers/navigate-to-registration';
import { isHCaptchaOracle } from '@/modules/worker/components/jobs-discovery/helpers/is-hcaptcha-oracle';
import type { Oracle } from '@/modules/worker/services/oracles';
import { handleHCaptchaNavigation } from '@/modules/worker/components/jobs-discovery/helpers/handle-hcaptcha-navigation';
import { navigateToOracleJobs } from '@/modules/worker/components/jobs-discovery/helpers/navigate-to-oracle-jobs';

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
    navigateToRegistration(oracle.address, navigate);
    return;
  }

  if (isHCaptchaOracle(oracle.address)) {
    handleHCaptchaNavigation({ siteKey, navigate });
    return;
  }

  navigateToOracleJobs(oracle, navigate);
};
