import { useGetRegistrationDataInOracles } from '../../jobs-discovery';

export const useIsAlreadyRegistered = (address: string | undefined) => {
  const { data } = useGetRegistrationDataInOracles();
  const arr = data?.oracle_addresses ?? [];
  const registeredInOracle = arr.find((o) => o === address);

  return Boolean(address && Boolean(registeredInOracle));
};
