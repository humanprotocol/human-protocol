import { useGetRegistrationDataInOracles } from '../../jobs-discovery';

export const useIsAlreadyRegistered = (address: string | undefined) => {
  const { data, isPending } = useGetRegistrationDataInOracles();

  if (!address) {
    return {
      registered: false,
      isPending: false,
    };
  }

  return {
    registered: (data?.oracle_addresses ?? []).includes(address),
    isPending,
  };
};
