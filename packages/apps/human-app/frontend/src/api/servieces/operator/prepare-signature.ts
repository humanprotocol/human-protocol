import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

export enum PrepareSignatureType {
  SignUp = 'SIGNUP',
  DisableOperator = 'DISABLE_OPERATOR',
}

export const prepareSignatureSuccessSchema = z.object({
  from: z.string(),
  to: z.string(),
  contents: z.string(),
});

export type SignatureData = z.infer<typeof prepareSignatureSuccessSchema>;

export function usePrepareSignature({
  address,
  type,
}: {
  address: string;
  type: PrepareSignatureType;
}) {
  return useQuery({
    queryFn: () =>
      apiClient(apiPaths.operator.web3Auth.prepareSignature.path, {
        successSchema: prepareSignatureSuccessSchema,
        options: { method: 'POST', body: JSON.stringify({ address, type }) },
      }),
    queryKey: [address, type],
    refetchInterval: 0,
  });
}
