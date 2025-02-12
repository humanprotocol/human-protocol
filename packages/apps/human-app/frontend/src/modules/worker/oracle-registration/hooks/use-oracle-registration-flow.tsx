import { useParams } from 'react-router-dom';
import { useCallback } from 'react';
import { useGetOracles } from '@/modules/worker/services/oracles';
import { useOracleInstructions } from './use-oracle-instructions';
import { useOracleRegistration } from './use-oracle-registration';

export function useOracleRegistrationFlow() {
  const { address: oracleAddress } = useParams<{ address: string }>();
  const { data: oraclesData } = useGetOracles();
  const oracleData = oraclesData?.find(
    (oracle) => oracle.address === oracleAddress
  );

  const { handleRegistration, isRegistrationPending, registrationError } =
    useOracleRegistration(oracleAddress);

  const { hasViewedInstructions, handleInstructionsView } =
    useOracleInstructions();

  const handleInstructionsViewWithData = useCallback(() => {
    handleInstructionsView(oracleData?.registrationInstructions ?? '');
  }, [oracleData, handleInstructionsView]);

  return {
    hasViewedInstructions,
    handleInstructionsView: handleInstructionsViewWithData,
    handleRegistration,
    isRegistrationPending,
    registrationError,
  };
}
