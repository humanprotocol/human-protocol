import { CryptoPaymentRequest, FiatPaymentRequest } from '../types';
import api from '../utils/api';

export const createCryptoPayment = async (body: CryptoPaymentRequest) => {
  await api.post('/payment/crypto', body);
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
