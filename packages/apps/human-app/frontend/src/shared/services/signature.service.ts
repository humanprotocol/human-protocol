import { z } from 'zod';
import { ApiClientError, HttpApiClient } from '@/api';
import { env } from '@/shared/env';

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
  private readonly httpClient: HttpApiClient;

  constructor() {
    this.httpClient = new HttpApiClient(env.VITE_API_URL);
  }

  async prepareSignature(data: PrepareSignatureBody) {
    try {
      const result = await this.httpClient.post<SignatureData>(
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
