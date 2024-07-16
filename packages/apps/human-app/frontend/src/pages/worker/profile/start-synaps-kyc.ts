import { Synaps } from '@synaps-io/verify-sdk';

export function startSynapsKyc(sessionId: string) {
  Synaps.init({
    sessionId,
    mode: 'modal',
  });
  Synaps.show();
}
