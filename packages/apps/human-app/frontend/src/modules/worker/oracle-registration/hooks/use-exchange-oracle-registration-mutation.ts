import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type RegistrationInExchangeOracleDto } from '../schema';
import { oracleRegistrationService } from '../services/oracle-registration.service';

export function useExchangeOracleRegistrationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegistrationInExchangeOracleDto) => {
      return oracleRegistrationService.registerInExchangeOracle(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
