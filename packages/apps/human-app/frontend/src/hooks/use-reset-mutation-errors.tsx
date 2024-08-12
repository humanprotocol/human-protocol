import { useEffect } from 'react';
import type { UseFormWatch } from 'react-hook-form';

export function useResetMutationErrors(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any allows auto inferring
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
