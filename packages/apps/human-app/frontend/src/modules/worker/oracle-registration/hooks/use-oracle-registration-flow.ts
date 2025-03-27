import { useOracleInstructions } from './use-oracle-instructions';
import { useOracleRegistration } from './use-oracle-registration';

export function useOracleRegistrationFlow(
  oracleInstructions?: string | URL | null | undefined
) {
  const { handleRegistration, isRegistrationPending, registrationError } =
    useOracleRegistration();

  const { hasViewedInstructions, handleInstructionsView } =
    useOracleInstructions(oracleInstructions);

  return {
    hasViewedInstructions,
    handleInstructionsView,
    handleRegistration,
    isRegistrationPending,
    registrationError,
  };
}
