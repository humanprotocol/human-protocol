import { useGetOracles } from '@/api/servieces/worker/oracles';
import { PageCardError, PageCardLoader } from '@/components/ui/page-card';
import { OraclesTable } from '@/pages/worker/oracles/oracle-table';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';

export function OraclesTableProvider() {
  const {
    data: oraclesData,
    error: oraclesDataError,
    isError: isOraclesDataError,
    isPending: isOraclesDataPending,
  } = useGetOracles();

  if (isOraclesDataPending) {
    return <PageCardLoader cardMaxWidth="100%" />;
  }

  if (isOraclesDataError) {
    return (
      <PageCardError errorMessage={defaultErrorMessage(oraclesDataError)} />
    );
  }

  return <OraclesTable oraclesData={oraclesData} />;
}
