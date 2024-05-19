import { Synaps } from '@synaps-io/verify-sdk';

export function useSynaps() {
  const startSynapsKyc = (sessionId: string) => {
    Synaps.init({
      sessionId,
      mode: 'modal',
    });
    Synaps.show();
  };
  return {
    startSynapsKyc,
  };
}
