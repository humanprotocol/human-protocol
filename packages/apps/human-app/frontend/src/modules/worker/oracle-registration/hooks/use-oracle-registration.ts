import { useCallback } from 'react';
import { type RegistrationInExchangeOracleDto } from '../schema';
import { useExchangeOracleRegistrationMutation } from './use-exchange-oracle-registration-mutation';

export function useOracleRegistration() {
  const {
    mutate: registerInOracle,
    isPending: isRegistrationPending,
    error: registrationError,
  } = useExchangeOracleRegistrationMutation();

  const handleRegistration = useCallback(
    (data: RegistrationInExchangeOracleDto) => {
      registerInOracle(data);
    },
    [registerInOracle]
  );

  return {
    handleRegistration,
    isRegistrationPending,
    registrationError,
  };
}
