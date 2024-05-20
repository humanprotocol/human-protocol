/* eslint-disable camelcase -- ...*/
import { z } from 'zod';

export const createPaginationSchema = <T>(resultsSchema: z.ZodType<T>) =>
  z.object({
    page: z.number(),
    page_size: z.number(),
    total_pages: z.number(),
    total_results: z.number(),
    results: z.array(resultsSchema),
  });
