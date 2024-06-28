import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { z } from 'zod';
import { apiPaths } from '../api-paths';

const successHMTPriceResponseSchema = z.object({
	'human-protocol': z.object({
		usd: z.number(),
	}),
});

export type HMTPrice = z.infer<typeof successHMTPriceResponseSchema>;

export function useHMTPrice() {
	return useQuery({
		queryFn: async () => {
			const { data } = await axios.get(apiPaths.hmtPrice);
			const validData = successHMTPriceResponseSchema.parse(data);

			return validData;
		},
		queryKey: ['useHMTPrice'],
	});
}
