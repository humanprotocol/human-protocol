import { useQuery } from '@tanstack/react-query';
import { TransactionUtils } from '@human-protocol/sdk';

export function useTransactionHistory() {
	return useQuery({
		queryFn: async () => {},
		queryKey: ['transactionHistory'],
	});
}
