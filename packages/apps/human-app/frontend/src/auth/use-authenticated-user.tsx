import { useContext } from 'react';
import { AuthenticatedUserContext } from '@/auth/require-auth';

export function useAuthenticatedUser() {
  const context = useContext(AuthenticatedUserContext);

  if (!context) {
    throw new Error(
      'Cannot use context of useAuthenticatedUser. Component is not included in protectedRoutes'
    );
  }

  return context;
}
