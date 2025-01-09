import { useContext } from 'react';
import { AuthContext } from '@/modules/auth/context/auth-context';

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('No context for useAuth');
  }

  return context;
}
