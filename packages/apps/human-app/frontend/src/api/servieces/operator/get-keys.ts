import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  getExistingKeys,
  getPendingKeys,
} from '@/smart-contracts/keys/get-keys';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';

export const getKeysCallArgumentsSchema = z.object({
  address: z.string(),
});

export type GetKeysCallArguments = z.infer<typeof getKeysCallArgumentsSchema>;

async function getKeysFn(data: GetKeysCallArguments) {
  const existingKeys = await getExistingKeys(data);
  const pendingKeys = await getPendingKeys(data);

  return { existingKeys, pendingKeys };
}

export function useGetKeys() {
  const { address } = useConnectedWallet();

  return useQuery({
    queryFn: () => getKeysFn({ address }),
    queryKey: ['getKeys', address],
  });
}
