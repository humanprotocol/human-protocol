import { z } from 'zod';

export const tokenSchema = z.string().transform((value, ctx) => {
  const token = value.split('=')[1];
  if (!token) {
    ctx.addIssue({
      fatal: true,
      code: z.ZodIssueCode.custom,
      message: 'error',
    });
  }
  return token;
});

export const routerStateSchema = z.object({
  email: z.string().email(),
  resendOnMount: z.boolean().optional(),
});
