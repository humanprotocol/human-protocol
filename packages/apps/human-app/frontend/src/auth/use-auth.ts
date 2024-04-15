import { useContext } from 'react';
import { AuthContext } from '@/auth/auth-context';

export function useAuth() {
  return useContext(AuthContext);
}
