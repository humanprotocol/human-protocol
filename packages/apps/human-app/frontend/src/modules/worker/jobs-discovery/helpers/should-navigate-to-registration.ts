import { type Oracle } from '../../services/oracles.service';

interface RegistrationResult {
  oracle_addresses: string[];
}

export const shouldNavigateToRegistration = (
  oracle: Oracle,
  registrationData?: RegistrationResult
): boolean =>
  Boolean(
    oracle.registrationNeeded &&
      !registrationData?.oracle_addresses.includes(oracle.address)
  );
