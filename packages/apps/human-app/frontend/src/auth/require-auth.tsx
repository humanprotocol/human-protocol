import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/use-auth';

export function RequireAuth({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.user) {
    return <Navigate replace state={{ from: location }} to="/" />;
  }

  return children;
}
