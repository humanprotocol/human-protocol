import { z } from 'zod';

export const kvstoreDataSchema = z.array(
  z.object({
    key: z.string(),
    value: z.string(),
  })
);

export type KvstoreData = z.infer<typeof kvstoreDataSchema>;
