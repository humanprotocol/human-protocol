import { z } from 'zod';
import { ApiClientError, humanAppApiClient } from '@/api';

const apiPaths = {
  web3: {
    prepareSignature: '/prepare-signature',
  },
};

export interface PrepareSignatureBody {
  address: string;
  type: PrepareSignatureType;
}

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

export class SignatureService {
  async prepareSignature(data: PrepareSignatureBody) {
    try {
      const result = await humanAppApiClient.post<SignatureData>(
        apiPaths.web3.prepareSignature,
        {
          body: { ...data },
          successSchema: prepareSignatureSuccessSchema,
        }
      );

      return result;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      throw new Error('Failed to prepare signature');
    }
  }
}

export const authService = new SignatureService();
