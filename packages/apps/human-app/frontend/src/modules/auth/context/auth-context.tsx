/* eslint-disable camelcase */
// web2-auth.tsx
import { z } from 'zod';
import { createAuthProvider } from '@/shared/contexts/generic-auth-context';

const extendableUserDataSchema = z.object({
  site_key: z.string().optional().nullable(),
  kyc_status: z.string().optional().nullable(),
  wallet_address: z.string().optional().nullable(),
  status: z.enum(['active', 'pending']),
});

const userDataSchema = z
  .object({
    email: z.string(),
    user_id: z.number(),
    reputation_network: z.string(),
    email_notifications: z.boolean().optional(),
    exp: z.number(),
  })
  .merge(extendableUserDataSchema);

export type UserData = z.infer<typeof userDataSchema>;

export const { AuthContext, AuthProvider } = createAuthProvider<UserData>({
  authType: 'web2',
  schema: userDataSchema,
});
