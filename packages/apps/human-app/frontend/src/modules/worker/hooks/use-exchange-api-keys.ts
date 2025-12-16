import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteExchangeApiKeys,
  enrollExchangeApiKeys,
  getExchangeApiKeys,
} from '../services/exchangeApiKeys.service';

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
      apiSecret: string;
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
  useDeleteExchangeApiKeys,
  useGetExchangeApiKeys,
  useEnrollExchangeApiKeys,
};
