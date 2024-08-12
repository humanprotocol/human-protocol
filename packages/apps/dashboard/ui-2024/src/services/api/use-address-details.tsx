import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { httpService } from '../http-service';
import { apiPaths } from '../api-paths';
import { useWalletSearch } from '@utils/hooks/use-wallet-search';
import { validateResponse } from '../../services/validate-response';

const walletSchema = z.object({
	chainId: z.number(),
	address: z.string(),
	balance: z.string(),
});

export type AddressDetailsWallet = z.infer<typeof walletSchema>;

const escrowSchema = z.object({
	chainId: z.number().optional().nullable(),
	address: z.string(),
	balance: z.string(),
	token: z.string(),
	factoryAddress: z.string(),
	totalFundedAmount: z.string(),
	amountPaid: z.string(),
	status: z.string(),
	manifest: z.string().optional().nullable(),
	launcher: z.string(),
	exchangeOracle: z.string(),
	recordingOracle: z.string(),
	reputationOracle: z.string(),
	finalResultsUrl: z.string(),
});

export type AddressDetailsEscrowSchema = z.infer<typeof escrowSchema>;

export enum Roles {
	jobLauncher = 'Job Launcher',
	exchangeOracle = 'Exchange Oracle',
	humanApp = 'Human App',
	recordingOracle = 'Recording Oracle',
	reputationOracle = 'Reputation Oracle',
}

const leaderSchema = z.object({
	chainId: z.number(),
	address: z.string(),
	balance: z.string(),
	role: z.nativeEnum(Roles),
	amountStaked: z.string(),
	amountAllocated: z.string(),
	amountLocked: z.string(),
	lockedUntilTimestamp: z.string(),
	reputation: z.number(),
	fee: z.number(),
	jobTypes: z.array(z.string()).optional().nullable(),
	url: z.string().optional().nullable(),
	reward: z.string(),
	amountJobsLaunched: z.string(),
});

export type AddressDetailsLeader = z.infer<typeof leaderSchema>;

const addressDetailsResponseSchema = z.object({
	wallet: z.optional(walletSchema),
	escrow: z.optional(escrowSchema),
	leader: z.optional(leaderSchema),
});

export type AddressDetails = z.infer<typeof addressDetailsResponseSchema>;

export function useAddressDetails() {
	const { filterParams } = useWalletSearch();

	return useQuery({
		queryFn: async () => {
			const { data } = await httpService.get(
				`${apiPaths.addressDetails.path}/${filterParams.address || '0x0'}`,
				{ params: { chainId: filterParams.chainId || -1 } }
			);

			const validResponse = validateResponse(
				data,
				addressDetailsResponseSchema
			);

			return validResponse;
		},
		queryKey: ['useAddressDetails', filterParams.address, filterParams.chainId],
	});
}
