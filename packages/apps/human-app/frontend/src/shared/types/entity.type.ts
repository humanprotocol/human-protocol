import { z } from 'zod';

export const testDataSchema = z.coerce.date();
export type TestData = z.infer<typeof testDataSchema>;
