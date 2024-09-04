import { useContext } from 'react';
import { Web3AuthContext } from '@/auth-web3/web3-auth-context';

export function useWeb3Auth() {
  const context = useContext(Web3AuthContext);

  if (!context) {
    throw new Error('No context for useWeb3Auth');
  }

  return context;
}
