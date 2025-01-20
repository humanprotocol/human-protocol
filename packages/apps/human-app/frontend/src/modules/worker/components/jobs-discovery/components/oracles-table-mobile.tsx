import { Grid, Stack } from '@mui/material';
import { Loader } from '@/shared/components/ui/loader';
import type { OraclesDataQueryResult } from '@/modules/worker/views/jobs-discovery/jobs-discovery.page';
import type { Oracle } from '@/modules/worker/services/oracles';
import { NoRecords } from '@/shared/components/ui/no-records';
import { OraclesTableItemMobile } from './oracles-table-item-mobile';

interface OraclesTableMobileProps {
  selectOracle: (oracle: Oracle) => void;
  oraclesQueryDataResult: OraclesDataQueryResult;
}

export function OraclesTableMobile({
  selectOracle,
  oraclesQueryDataResult,
}: Readonly<OraclesTableMobileProps>) {
  const {
    data: oraclesData,
    isError: isOraclesDataError,
    isPending: isOraclesDataPending,
  } = oraclesQueryDataResult;

  if (isOraclesDataPending) {
    return (
      <Grid
        container
        sx={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}
      >
        <Loader />
      </Grid>
    );
  }

  if (isOraclesDataError) {
    return <NoRecords />;
  }

  return (
    <Stack flexDirection="column">
      {oraclesData.map((oracle) => (
        <OraclesTableItemMobile
          key={`${oracle.address}-${oracle.name}`}
          oracle={oracle}
          selectOracle={selectOracle}
        />
      ))}
    </Stack>
  );
}
