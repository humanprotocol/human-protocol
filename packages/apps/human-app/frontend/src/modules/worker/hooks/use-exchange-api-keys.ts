import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteExchangeApiKeys,
  enrollExchangeApiKeys,
  getExchangeApiKeys,
  getSupportedExchanges,
  getStakeSummary,
} from '../services/exchangeApiKeys.service';

function useGetStakeSummary() {
  return useQuery({
    queryKey: ['stake-summary'],
    queryFn: () => getStakeSummary(),
  });
}

function useGetSupportedExchanges() {
  return useQuery({
    queryKey: ['supported-exchanges'],
    queryFn: () => getSupportedExchanges(),
    select: (data) =>
      data.map((exchange: string) => ({
        name: exchange,
        displayName: exchange.charAt(0).toUpperCase() + exchange.slice(1),
      })),
  });
}

function useGetExchangeApiKeys() {
  return useQuery({
    queryKey: ['exchange-api-keys'],
    queryFn: () => getExchangeApiKeys(),
  });
}

function useEnrollExchangeApiKeys() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['enroll-exchange-api-keys'],
    mutationFn: (data: {
      exchange: string;
      apiKey: string;
      secretKey: string;
    }) => enrollExchangeApiKeys(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-api-keys'] });
    },
  });
}

function useDeleteExchangeApiKeys() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['delete-exchange-api-keys'],
    mutationFn: () => deleteExchangeApiKeys(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-api-keys'] });
    },
  });
}

export {
  useGetStakeSummary,
  useGetSupportedExchanges,
  useDeleteExchangeApiKeys,
  useGetExchangeApiKeys,
  useEnrollExchangeApiKeys,
};
