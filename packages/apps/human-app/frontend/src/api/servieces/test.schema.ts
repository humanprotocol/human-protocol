import { z } from 'zod';
import { testDataSchema } from '@/shared/types/entity.type';

export const testSchema = z.object({
  requestId: z.string(),
  timestamp: testDataSchema,
});
