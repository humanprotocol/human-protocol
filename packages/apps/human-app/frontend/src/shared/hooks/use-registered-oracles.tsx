import { useContext } from 'react';
import { RegisteredOraclesContext } from '../contexts/registered-oracles';

export const useRegisteredOracles = () => {
  const context = useContext(RegisteredOraclesContext);
  if (!context) {
    throw new Error(
      'useRegisteredOracles must be used within a RegisteredOraclesProvider'
    );
  }
  return context;
};
