import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  type RegistrationInExchangeOracleDto,
  useExchangeOracleRegistrationMutation,
} from '@/modules/worker/services/registration-in-exchange-oracles';
import { useRegisteredOracles } from '@/shared/contexts/registered-oracles';
import { useGetOracles } from '@/modules/worker/services/oracles';
import { routerPaths } from '@/router/router-paths';

export function useRegistrationPageLogic() {
  const navigate = useNavigate();
  const { address: oracleAddress } = useParams<{ address: string }>();
  const [hasClickedRegistrationLink, setHasClickedRegistrationLink] =
    useState(false);

  const { data: oraclesData } = useGetOracles();
  const oracleData = oraclesData?.find(
    (oracle) => oracle.address === oracleAddress
  );

  const { registeredOracles, setRegisteredOracles } = useRegisteredOracles();

  const {
    mutate: userRegistrationMutate,
    isPending: isRegistrationInExchangeOraclePending,
    error: registrationInExchangeOracleError,
  } = useExchangeOracleRegistrationMutation();

  const handleInstructionsLinkClick = () => {
    window.open(oracleData?.registrationInstructions ?? '', '_blank');
    setHasClickedRegistrationLink(true);
  };

  const handleRegistrationComplete = (
    data: RegistrationInExchangeOracleDto
  ) => {
    userRegistrationMutate(data, {
      onSuccess() {
        if (oracleAddress) {
          setRegisteredOracles((prev) =>
            prev ? [...prev, oracleAddress] : [oracleAddress]
          );
        }
        navigateToJobs();
      },
    });
  };

  const navigateToJobs = useCallback(() => {
    navigate(`${routerPaths.worker.jobs}/${oracleAddress ?? ''}`, {
      state: { oracleAddress },
    });
  }, [navigate, oracleAddress]);

  useEffect(() => {
    if (oracleData === undefined) {
      navigate(routerPaths.worker.jobsDiscovery);
    }
  }, [oracleData, navigate]);

  useEffect(() => {
    if (registeredOracles?.find((a) => a === oracleAddress)) {
      navigateToJobs();
    }
  }, [registeredOracles, oracleAddress, navigateToJobs]);

  return {
    oracleData,
    hasClickedRegistrationLink,
    handleInstructionsLinkClick,
    handleRegistrationComplete,
    isRegistrationInExchangeOraclePending,
    registrationInExchangeOracleError,
  };
}
