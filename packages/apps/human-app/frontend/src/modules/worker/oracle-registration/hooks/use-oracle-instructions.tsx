import { useState, useCallback } from 'react';

export function useOracleInstructions() {
  const [hasViewedInstructions, setHasViewedInstructions] = useState(false);

  const handleInstructionsView = useCallback((instructionsUrl: string) => {
    window.open(instructionsUrl, '_blank');
    setHasViewedInstructions(true);
  }, []);

  return { hasViewedInstructions, handleInstructionsView };
}
