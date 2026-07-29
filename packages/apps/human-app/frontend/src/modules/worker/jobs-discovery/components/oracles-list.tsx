import { Grid, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { Loader } from '@/shared/components/ui/loader';
import { NoRecords } from '@/shared/components/ui/no-records';
import { PageCardError } from '@/shared/components/ui/page-card';
import { OracleJobCard } from './oracle-job-card';
import { Oracle } from '../../services/oracles.service';

type OraclesListProps = {
  data: Oracle[] | undefined;
  isError: boolean;
  isPending: boolean;
};

export function OraclesList({ data, isError, isPending }: OraclesListProps) {
  const { t } = useTranslation();

  if (isPending) {
    return (
      <Stack
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <Loader />
      </Stack>
    );
  }

  if (isError) {
    return (
      <PageCardError
        errorMessage={t('worker.oraclesTable.error.gettingOracles')}
      />
    );
  }

  if (!data?.length) {
    return <NoRecords />;
  }

  return (
    <Grid container spacing={{ xs: 1.5, md: 4 }}>
      {data.map((oracle) => (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={oracle.address}>
          <OracleJobCard oracle={oracle} />
        </Grid>
      ))}
    </Grid>
  );
}
