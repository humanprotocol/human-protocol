import { useContext } from 'react';
import { ProtectedLayoutContext } from '@/components/layout/protected/layout-notification-context';

export function useProtectedLayoutNotification() {
  const context = useContext(ProtectedLayoutContext);

  if (!context) {
    throw new Error('No context for useProtectedLayoutNotification');
  }

  return context;
}
