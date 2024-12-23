import useSWR from 'swr';
import * as paymentService from '../services/payment';

export const usePayments = ({
  page,
  pageSize,
}: {
  page?: number;
  pageSize?: number;
}) => {
  return useSWR(`human-protocol-Payments--${page}-${pageSize}`, async () => {
    try {
      const payments = await paymentService.getPayments({
        page,
        pageSize,
      });
      return payments;
    } catch (err) {
      return [];
    }
  });
};
