import { useCallback } from 'react';
import { useRegisteredOracles } from '@/shared/contexts/registered-oracles';
import { type RegistrationInExchangeOracleDto } from '../schema';
import { useExchangeOracleRegistrationMutation } from './use-exchange-oracle-registration-mutation';

export function useOracleRegistration(oracleAddress: string | undefined) {
  const { setRegisteredOracles } = useRegisteredOracles();
  const {
    mutate: registerInOracle,
    isPending: isRegistrationPending,
    error: registrationError,
  } = useExchangeOracleRegistrationMutation();

  const handleRegistration = useCallback(
    (data: RegistrationInExchangeOracleDto) => {
      registerInOracle(data, {
        onSuccess() {
          if (oracleAddress) {
            setRegisteredOracles((prev) =>
              prev ? [...prev, oracleAddress] : [oracleAddress]
            );
          }
        },
      });
    },
    [oracleAddress, registerInOracle, setRegisteredOracles]
  );

  return {
    handleRegistration,
    isRegistrationPending,
    registrationError,
  };
}
