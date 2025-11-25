import { useEffect } from 'react';
import type { UseFormWatch } from 'react-hook-form';

export function useResetMutationErrors(
  watch: UseFormWatch<any>,
  resetFn: () => void
) {
  useEffect(() => {
    const subscription = watch(
      (_, { type }) => {
        if (type !== undefined) {
          resetFn();
        }
      },
      { type: 'change' }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [watch, resetFn]);
}
