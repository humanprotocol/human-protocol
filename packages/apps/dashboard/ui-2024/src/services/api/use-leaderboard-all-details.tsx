import { useQuery } from '@tanstack/react-query';
import { httpService } from '../http-service';
import { apiPaths } from '../api-paths';
import { validateResponse } from '@services/validate-response';
import { useLeaderboardSearch } from '@utils/hooks/use-leaderboard-search';
import { leaderBoardSuccessResponseSchema } from '@services/api/use-leaderboard-details';

export function useLeaderboardAllDetails() {
	const {
		filterParams: { chainId },
	} = useLeaderboardSearch();

	return useQuery({
		queryFn: async () => {
			const { data } = await httpService.get(
				apiPaths.leaderboardDetailsAll.path,
				{
					params: { chainId: chainId === -1 ? undefined : chainId },
				}
			);

			const validResponse = validateResponse(
				data,
				leaderBoardSuccessResponseSchema
			);

			return validResponse;
		},
		queryKey: ['useLeaderboardAllDetails', chainId],
	});
}
