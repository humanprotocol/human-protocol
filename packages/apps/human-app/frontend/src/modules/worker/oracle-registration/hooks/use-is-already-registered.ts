import { useGetRegistrationDataInOracles } from '../../jobs-discovery';

export const useIsAlreadyRegistered = (address: string | undefined) => {
  const { data } = useGetRegistrationDataInOracles();

  if (!address) {
    return false;
  }

  return (data?.oracle_addresses ?? []).includes(address);
};
