import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteExchangeApiKeys,
  enrollExchangeApiKeys,
  getExchangeApiKeys,
  getSupportedExchanges,
} from '../services/exchangeApiKeys.service';

function useGetSupportedExchanges() {
  return useQuery({
    queryKey: ['supported-exchanges'],
    queryFn: () => getSupportedExchanges(),
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
      queryClient.invalidateQueries({ queryKey: ['staking-summary'] });
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
      queryClient.invalidateQueries({ queryKey: ['staking-summary'] });
    },
  });
}

export {
  useGetSupportedExchanges,
  useDeleteExchangeApiKeys,
  useGetExchangeApiKeys,
  useEnrollExchangeApiKeys,
};
