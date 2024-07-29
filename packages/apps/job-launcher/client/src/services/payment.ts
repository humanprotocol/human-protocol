import { WalletClient } from 'viem';

import { PAYMENT_SIGNATURE_KEY } from '../constants/payment';
import { CryptoPaymentRequest, FiatPaymentRequest } from '../types';
import api from '../utils/api';

export const createCryptoPayment = async (
  signer: WalletClient,
  body: CryptoPaymentRequest,
) => {
  if (!signer.account) {
    throw new Error('Account not found');
  }

  const signature = await signer.signMessage({
    account: signer.account,
    message: JSON.stringify(body),
  });
  await api.post('/payment/crypto', body, {
    headers: { [PAYMENT_SIGNATURE_KEY]: signature },
  });
};

export const createFiatPayment = async (body: FiatPaymentRequest) => {
  const { data } = await api.post('/payment/fiat', body);

  return data;
};

export const confirmFiatPayment = async (paymentId: string) => {
  const { data } = await api.post('/payment/fiat/confirm-payment', {
    paymentId,
  });

  return data;
};

export const getRate = async (from: string, to: string) => {
  const { data } = await api.get('/payment/rates', {
    params: { from, to },
  });

  return data;
};

export const getFee = async () => {
  const { data } = await api.get('/payment/min-fee');

  return data;
};

export const getOperatorAddress = async () => {
  const { data } = await api.get('/web3/operator-address');

  return data;
};
