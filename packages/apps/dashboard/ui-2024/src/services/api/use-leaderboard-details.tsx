import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { httpService } from '../http-service';
import { apiPaths } from '../api-paths';
import { validateResponse } from '@services/validate-response';
import { useLeaderboardSearch } from '@utils/hooks/use-leaderboard-search';

const leaderBoardEntity = z.object({
	address: z.string(),
	role: z.string(),
	amountStaked: z.string().transform((value, ctx) => {
		const valueAsNumber = Number(value);

		if (Number.isNaN(valueAsNumber)) {
			ctx.addIssue({
				path: ['amountStaked'],
				code: z.ZodIssueCode.custom,
			});
		}

		return valueAsNumber / 10 ** 18;
	}),
	reputation: z.union([z.string(), z.number()]).transform((value) => {
		return `${value}`;
	}),
	fee: z.number(),
	jobTypes: z.array(z.string()),
	url: z.string(),
	chainId: z.number(),
});

export const leaderBoardSuccessResponseSchema = z.array(leaderBoardEntity);
export type LeaderBoardEntity = z.infer<typeof leaderBoardEntity>;
export type LeaderBoardData = z.infer<typeof leaderBoardSuccessResponseSchema>;

export function useLeaderboardDetails() {
	const {
		filterParams: { chainId },
	} = useLeaderboardSearch();

	return useQuery({
		queryFn: async () => {
			const { data } = await httpService.get(apiPaths.leaderboardDetails.path, {
				params: { chainId: chainId === -1 ? undefined : chainId },
			});

			const validResponse = validateResponse(
				data,
				leaderBoardSuccessResponseSchema
			);

			return validResponse;
		},
		queryKey: ['useLeaderboardDetails', chainId],
	});
}
