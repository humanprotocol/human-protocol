import { useRegisteredOracles } from '@/shared/contexts/registered-oracles';

export const useIsAlreadyRegistered = (address: string | undefined) => {
  const { registeredOracles } = useRegisteredOracles();

  return Boolean(address && registeredOracles?.includes(address));
};
