import { useMutation } from '@tanstack/react-query';
import { type RegistrationInExchangeOracleDto } from '../schema';
import * as oracleRegistrationService from '../services/oracle-registration.service';

export function useExchangeOracleRegistrationMutation() {
  return useMutation({
    mutationFn: async (data: RegistrationInExchangeOracleDto) =>
      oracleRegistrationService.registerInExchangeOracle(data),
  });
}
