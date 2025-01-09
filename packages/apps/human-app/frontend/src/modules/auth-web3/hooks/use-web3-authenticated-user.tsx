import { useContext } from 'react';
import { Web3AuthenticatedUserContext } from '@/modules/auth-web3/providers/require-web3-auth';

export function useWeb3AuthenticatedUser() {
  const context = useContext(Web3AuthenticatedUserContext);

  if (!context) {
    throw new Error(
      'Cannot use context of useWeb3AuthenticatedUser. Component is not included in web3AuthProtectedRoutes'
    );
  }

  return context;
}
