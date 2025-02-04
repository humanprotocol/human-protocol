import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useGetOracles } from '@/modules/worker/services/oracles';
import { useOracleInstructions } from './use-oracle-instructions';
import { useOracleNavigation } from './use-oracle-navigation';
import { useOracleRegistration } from './use-oracle-registration';

export function useOracleRegistrationFlow() {
  const { address: oracleAddress } = useParams<{ address: string }>();
  const { data: oraclesData } = useGetOracles();
  const oracleData = oraclesData?.find(
    (oracle) => oracle.address === oracleAddress
  );

  const { navigateToJobs, navigateToDiscovery } =
    useOracleNavigation(oracleAddress);
  const {
    handleRegistration,
    isRegistrationPending,
    registrationError,
    isAlreadyRegistered,
  } = useOracleRegistration(oracleAddress);
  const { hasViewedInstructions, handleInstructionsView } =
    useOracleInstructions();

  useEffect(() => {
    if (oracleData === undefined) {
      navigateToDiscovery();
    }
  }, [oracleData, navigateToDiscovery]);

  useEffect(() => {
    if (isAlreadyRegistered) {
      navigateToJobs();
    }
  }, [isAlreadyRegistered, navigateToJobs]);

  const handleInstructionsViewWithData = () => {
    handleInstructionsView(oracleData?.registrationInstructions ?? '');
  };

  return {
    oracleData,
    hasViewedInstructions,
    handleInstructionsView: handleInstructionsViewWithData,
    handleRegistration,
    isRegistrationPending,
    registrationError,
  };
}
