import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { httpService } from '../http-service';
import { apiPaths } from '../api-paths';
import { useWalletSearch } from '@utils/hooks/use-wallet-search';
import { validateResponse } from '../../services/validate-response';
import { reputationSchema } from '@services/api/use-leaderboard-details';

const transformOptionalTokenAmount = (
	value: string | undefined | null,
	ctx: z.RefinementCtx
) => {
	if (value === undefined || value === null) return value;

	const valueAsNumber = Number(value);

	if (Number.isNaN(valueAsNumber)) {
		ctx.addIssue({
			path: ['amountStaked'],
			code: z.ZodIssueCode.custom,
		});
	}

	return valueAsNumber / 10 ** 18;
};

const walletSchema = z.object({
	chainId: z.number(),
	address: z.string(),
	balance: z.string().transform(transformOptionalTokenAmount),
});

export type AddressDetailsWallet = z.infer<typeof walletSchema>;

const escrowSchema = z.object({
	chainId: z.number().optional().nullable(),
	address: z.string().optional().nullable(),
	balance: z
		.string()
		.optional()
		.nullable()
		.transform(transformOptionalTokenAmount),
	token: z.string().optional().nullable(),
	factoryAddress: z.string().optional().nullable(),
	totalFundedAmount: z
		.string()
		.optional()
		.nullable()
		.transform(transformOptionalTokenAmount),
	amountPaid: z
		.string()
		.optional()
		.nullable()
		.transform(transformOptionalTokenAmount),
	status: z.string().optional().nullable(),
	manifest: z.string().optional().nullable(),
	launcher: z.string().optional().nullable(),
	exchangeOracle: z.string().optional().nullable(),
	recordingOracle: z.string().optional().nullable(),
	reputationOracle: z.string().optional().nullable(),
	finalResultsUrl: z.string().nullable(),
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
	balance: z.string().transform(transformOptionalTokenAmount),
	role: z.nativeEnum(Roles).nullable(),
	amountStaked: z.string().optional().transform(transformOptionalTokenAmount),
	amountAllocated: z
		.string()
		.optional()
		.transform(transformOptionalTokenAmount),
	amountLocked: z.string().optional().transform(transformOptionalTokenAmount),
	lockedUntilTimestamp: z.string().optional(),
	reputation: reputationSchema,
	fee: z.number(),
	jobTypes: z.array(z.string()).optional().nullable(),
	url: z.string().optional().nullable(),
	reward: z.string().optional(),
	amountJobsProcessed: z.string(),
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
			const address = filterParams.address || '0x0';
			const { data } = await httpService.get(
				`${apiPaths.addressDetails.path}/${address}`,
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
