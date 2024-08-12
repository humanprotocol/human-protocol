import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { httpService } from '../http-service';
import { apiPaths } from '../api-paths';
import { validateResponse } from '@services/validate-response';

const successGeneralStatsResponseSchema = z.object({
	totalHolders: z.number(),
	totalTransactions: z.number(),
});

export type GeneralStats = z.infer<typeof successGeneralStatsResponseSchema>;

export function useGeneralStats() {
	return useQuery({
		queryFn: async () => {
			const { data } = await httpService.get(apiPaths.generalStats.path);

			const validResponse = validateResponse(
				data,
				successGeneralStatsResponseSchema
			);

			return validResponse;
		},
		queryKey: ['useGeneralStats'],
	});
}
