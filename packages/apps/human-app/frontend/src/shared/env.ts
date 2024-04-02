import { z } from 'zod';

export const env = z
  .object({
    VITE_API_URL: z.string().default('/api'),
  })
  .parse(import.meta.env);
