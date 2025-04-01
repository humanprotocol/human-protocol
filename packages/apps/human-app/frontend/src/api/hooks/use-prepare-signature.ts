import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

export enum PrepareSignatureType {
  SIGN_UP = 'signup',
  SIGN_IN = 'signin',
  DISABLE_OPERATOR = 'disable_operator',
  ENABLE_OPERATOR = 'enable_operator',
  REGISTER_ADDRESS = 'register_address',
}

export const prepareSignatureSuccessSchema = z.object({
  from: z.string(),
  to: z.string(),
  contents: z.string(),
  nonce: z.unknown(),
});

export type SignatureData = z.infer<typeof prepareSignatureSuccessSchema>;
export interface PrepareSignatureBody {
  address: string;
  type: PrepareSignatureType;
}

export const prepareSignature = (body: PrepareSignatureBody) => {
  return apiClient(apiPaths.operator.web3Auth.prepareSignature.path, {
    successSchema: prepareSignatureSuccessSchema,
    options: { method: 'POST', body: JSON.stringify(body) },
  });
};

export function usePrepareSignature(body: PrepareSignatureBody) {
  return useQuery({
    queryFn: () => prepareSignature(body),
    refetchInterval: 0,
    queryKey: ['prepareSignature'],
  });
}
