import useSWR from 'swr';
import * as paymentService from '../services/payment';

export const useTokenRate = (from: string, to: string) => {
  return useSWR(`rate-${from}-${to}`, () => paymentService.getRate(from, to));
};
