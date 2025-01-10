import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { httpService } from '../http-service';
import { apiPaths } from '../api-paths';
import { validateResponse } from '@services/validate-response';
import { useLeaderboardSearch } from '@utils/hooks/use-leaderboard-search';

export const reputationSchema = z.unknown().transform((value) => {
  try {
    const knownReputation = z
      .union([z.literal('Low'), z.literal('Medium'), z.literal('High')])
      .parse(value);

    return knownReputation;
  } catch (error) {
    return 'Unknown';
  }
});

export type Reputation = z.infer<typeof reputationSchema>;

const leaderBoardEntity = z.object({
  address: z.string(),
  role: z.string(),
  amountStaked: z
    .string()
    .transform((value, ctx) => {
      const valueAsNumber = Number(value);

      if (Number.isNaN(valueAsNumber)) {
        ctx.addIssue({
          path: ['amountStaked'],
          code: z.ZodIssueCode.custom,
        });
      }

      return valueAsNumber / 10 ** 18;
    })
    .nullable(),
  reputation: reputationSchema,
  fee: z.number().nullable(),
  jobTypes: z.array(z.string()).nullable(),
  url: z.string().nullable(),
  website: z.string().nullable(),
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
      if (chainId === -1) {
        return [];
      }
      const { data } = await httpService.get(apiPaths.leaderboardDetails.path, {
        params: { chainId },
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
