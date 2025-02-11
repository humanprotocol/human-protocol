/* eslint-disable camelcase -- ... */
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type RegistrationInExchangeOracleDto,
  registrationInExchangeOracleDtoSchema,
} from '@/modules/worker/services/registration-in-exchange-oracles';

export function useRegistrationForm() {
  const { address: oracleAddress } = useParams<{ address: string }>();

  return useForm<RegistrationInExchangeOracleDto>({
    defaultValues: {
      oracle_address: oracleAddress,
      h_captcha_token: '',
    },
    resolver: zodResolver(registrationInExchangeOracleDtoSchema),
  });
}
