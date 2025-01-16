import { WalletClient } from 'viem';

import { HUMAN_SIGNATURE_KEY } from '../constants';
import api from '../utils/api';

export const solveJob = async (signer: WalletClient, body: any) => {
  if (!signer.account) {
    throw new Error('Account not found');
  }

  const signature = await signer.signMessage({
    account: signer.account,
    message: JSON.stringify(body),
  });
  await api.post('/job/solve', body, {
    headers: { [HUMAN_SIGNATURE_KEY]: signature },
  });
};
