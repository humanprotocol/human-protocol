import { useState, useCallback } from 'react';

export function useOracleInstructions(
  instructions?: string | URL | null | undefined
) {
  const [hasViewedInstructions, setHasViewedInstructions] = useState(false);

  const handleInstructionsView = useCallback(() => {
    window.open(instructions ?? '', '_blank');
    setHasViewedInstructions(true);
  }, [instructions]);

  return { hasViewedInstructions, handleInstructionsView };
}
