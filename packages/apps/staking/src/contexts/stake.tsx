import React, { createContext, useContext } from 'react';
import { useStake } from '../hooks/useStake';

const StakeContext = createContext<ReturnType<typeof useStake> | undefined>(
  undefined
);

export const StakeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const stake = useStake();

  return (
    <StakeContext.Provider value={stake}>{children}</StakeContext.Provider>
  );
};

export const useStakeContext = () => {
  const context = useContext(StakeContext);
  if (!context) {
    throw new Error('useStakeContext must be used within a StakeProvider');
  }
  return context;
};
