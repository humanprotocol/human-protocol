import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { httpService } from '../http-service';
import { apiPaths } from '../api-paths';
import { validateResponse } from '@services/validate-response';

const successHcaptchaGeneralStatsResponseSchema = z.object({
	solved: z.number(),
});

export type HcaptchaGeneralStats = z.infer<
	typeof successHcaptchaGeneralStatsResponseSchema
>;

export function useHcaptchaGeneralStats() {
	return useQuery({
		queryFn: async () => {
			const { data } = await httpService.get(
				apiPaths.hcaptchaGeneralStats.path
			);

			const validResponse = validateResponse(
				data,
				successHcaptchaGeneralStatsResponseSchema
			);

			return validResponse;
		},
		queryKey: ['useHcaptchaGeneralStats'],
	});
}
