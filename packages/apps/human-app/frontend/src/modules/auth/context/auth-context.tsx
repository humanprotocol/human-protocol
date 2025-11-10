/* eslint-disable camelcase */
import { z } from 'zod';
import { createAuthProvider } from '@/shared/contexts/generic-auth-context';
import { KycStatus } from '@/modules/worker/profile/types';

const userDataSchema = z.object({
  site_key: z.string().optional().nullable(),
  kyc_status: z.enum(KycStatus).optional().nullable(),
  wallet_address: z.string().optional().nullable(),
  status: z.enum(['active', 'pending']),
  email: z.string(),
  user_id: z.number(),
  reputation_network: z.string(),
  exp: z.number(),
});

export type UserData = z.infer<typeof userDataSchema>;

export const { AuthContext, AuthProvider } = createAuthProvider<UserData>({
  authType: 'web2',
  schema: userDataSchema,
});
