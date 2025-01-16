/* eslint-disable camelcase -- ...*/
import { z } from 'zod';

export const createPaginationSchema = <T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- keep zod automatic inferring
  resultsSchema: z.ZodType<T, any, any>
) =>
  z.object({
    page: z.number(),
    page_size: z.number(),
    total_pages: z.number(),
    total_results: z.number(),
    results: z.array(resultsSchema),
  });
