import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

export const verifyEmailDtoSchema = z.object({
  token: z.string(),
});

export type VerifyDto = z.infer<typeof verifyEmailDtoSchema>;

const VerifyEmailSuccessResponseSchema = z.unknown();

async function verifyEmailQueryFn(data: VerifyDto) {
  return apiClient(apiPaths.worker.verifyEmail.path, {
    authenticated: true,
    successSchema: VerifyEmailSuccessResponseSchema,
    options: { method: 'POST', body: JSON.stringify(data) },
  });
}

export function useVerifyEmailQuery({ token }: { token: string }) {
  return useQuery({
    queryFn: () => verifyEmailQueryFn({ token }),
    queryKey: [token],
    refetchInterval: 0,
  });
}
