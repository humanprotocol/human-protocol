import { z } from 'zod';

export const testDataSchema = z.coerce.date();
export type TestData = z.infer<typeof testDataSchema>;
export type PageSize = 5 | 10;
