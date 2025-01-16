import { useNavigate } from 'react-router-dom';
import type { Oracle } from '@/modules/worker/services/oracles';
import type { OraclesDataQueryResult } from '@/modules/worker/views/jobs-discovery/jobs-discovery.page';
import { useGetRegistrationInExchangeOracles } from '@/modules/worker/services/get-registration-in-exchange-oracles';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { OraclesTableMobile } from '@/modules/worker/components/jobs-discovery/components/oracles-table-mobile';
import { OraclesTableDesktop } from '@/modules/worker/components/jobs-discovery/components/oracles-table-desktop';
import { handleOracleNavigation } from '@/modules/worker/components/jobs-discovery/helpers/handle-oracle-navigation';

export function OraclesTable({
  oraclesQueryDataResult,
}: {
  oraclesQueryDataResult: OraclesDataQueryResult;
}) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuthenticatedUser();
  const { data: registrationInExchangeOraclesResult } =
    useGetRegistrationInExchangeOracles();
  const {
    data: oraclesData,
    isError: isOraclesDataError,
    isPending: isOraclesDataPending,
  } = oraclesQueryDataResult;

  const selectOracle = (oracle: Oracle) => {
    handleOracleNavigation({
      oracle,
      siteKey: user.site_key,
      navigate,
      registrationData: registrationInExchangeOraclesResult,
    });
  };

  return isMobile ? (
    <OraclesTableMobile
      oraclesQueryDataResult={oraclesQueryDataResult}
      selectOracle={selectOracle}
    />
  ) : (
    <OraclesTableDesktop
      isOraclesDataError={isOraclesDataError}
      isOraclesDataPending={isOraclesDataPending}
      selectOracle={selectOracle}
      oraclesData={oraclesData}
    />
  );
}
