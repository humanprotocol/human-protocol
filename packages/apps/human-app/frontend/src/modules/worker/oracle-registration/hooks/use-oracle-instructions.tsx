import { useState, useCallback } from 'react';
import { useGetOracles } from '../../services/oracles';

export function useOracleInstructions(oracleAddress?: string) {
  const [hasViewedInstructions, setHasViewedInstructions] = useState(false);
  const { data: oraclesData } = useGetOracles();
  const oracleData = oraclesData?.find(
    (oracle) => oracle.address === oracleAddress
  );

  const handleInstructionsView = useCallback(() => {
    window.open(oracleData?.registrationInstructions ?? '', '_blank');
    setHasViewedInstructions(true);
  }, [oracleData]);

  return { hasViewedInstructions, handleInstructionsView };
}
