import type { Oracle } from '@/modules/worker/services/oracles';

interface RegistrationResult {
  oracle_addresses: string[];
}

export const shouldNavigateToRegistration = (
  oracle: Oracle,
  registrationData?: RegistrationResult
): boolean => {
  if (!oracle.registrationNeeded) return false;

  return !registrationData?.oracle_addresses.includes(oracle.address);
};
