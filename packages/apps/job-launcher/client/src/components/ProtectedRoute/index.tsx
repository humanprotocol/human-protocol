import * as React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAppSelector } from '../../state';
import { UserStatus } from '../../state/auth/types';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthed, user } = useAppSelector((state) => state.auth);
  let location = useLocation();

  if (!isAuthed) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  } else if (isAuthed && user?.status === UserStatus.PENDING) {
    return <Navigate to="/validate" />;
  }

  return children;
}
