/* eslint-disable camelcase */
import { z } from 'zod';
import { createAuthProvider } from '@/shared/contexts/generic-auth-context';

export enum OperatorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

const web3userDataSchema = z.object({
  user_id: z.number(),
  wallet_address: z.string(),
  reputation_network: z.string(),
  operator_status: z.nativeEnum(OperatorStatus),
  exp: z.number(),
  status: z.literal('active'),
});

export type Web3UserData = z.infer<typeof web3userDataSchema>;

export const { AuthContext: Web3AuthContext, AuthProvider: Web3AuthProvider } =
  createAuthProvider<Web3UserData>({
    authType: 'web3',
    schema: web3userDataSchema,
  });
