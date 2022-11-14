import { useContext } from 'react';
import { NetworkContext } from './context';

export const useNetwork = () => {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error('You forgot to use NetworkProvider');
  }

  return context;
};
