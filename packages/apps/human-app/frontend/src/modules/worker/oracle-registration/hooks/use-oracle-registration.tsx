import { useCallback } from 'react';
import {
  type RegistrationInExchangeOracleDto,
  useExchangeOracleRegistrationMutation,
} from '@/modules/worker/services/registration-in-exchange-oracles';
import { useRegisteredOracles } from '@/shared/contexts/registered-oracles';

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
