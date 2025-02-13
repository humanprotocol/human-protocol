import { useParams } from 'react-router-dom';
import { useOracleInstructions } from './use-oracle-instructions';
import { useOracleRegistration } from './use-oracle-registration';

export function useOracleRegistrationFlow() {
  const { address } = useParams<{ address: string }>();

  const { handleRegistration, isRegistrationPending, registrationError } =
    useOracleRegistration(address);

  const { hasViewedInstructions, handleInstructionsView } =
    useOracleInstructions(address);

  return {
    hasViewedInstructions,
    handleInstructionsView,
    handleRegistration,
    isRegistrationPending,
    registrationError,
  };
}
