import { Grid, Paper, Typography } from '@mui/material';
import { t } from 'i18next';
import { Chips } from '@/shared/components/ui/chips';
import { TableButton } from '@/shared/components/ui/table-button';
import { EvmAddress } from '@/modules/worker/components/jobs/evm-address';
import { ListItem } from '@/shared/components/ui/list-item';
import type { JobType } from '@/modules/smart-contracts/EthKVStore/config';
import { useColorMode } from '@/shared/contexts/color-mode';
import { type Oracle } from '../hooks';

interface OraclesTableItemMobileProps {
  oracle: Oracle;
  selectOracle: (oracle: Oracle) => void;
}

export function OraclesTableItemMobile({
  oracle,
  selectOracle,
}: Readonly<OraclesTableItemMobileProps>) {
  const { colorPalette } = useColorMode();

  return (
    <Paper
      sx={{
        px: '16px',
        py: '32px',
        backgroundColor: colorPalette.white,
        marginBottom: '20px',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: 'none',
      }}
    >
      <Grid item>
        <ListItem label={t('worker.oraclesTable.oracleAddress')}>
          <EvmAddress address={oracle.address} />
        </ListItem>
        <ListItem label={t('worker.oraclesTable.annotationTool')}>
          <Typography variant="body2">{oracle.name}</Typography>
        </ListItem>
        <ListItem label={t('worker.oraclesTable.jobTypes')}>
          <Chips
            data={oracle.jobTypes.map((jobType) =>
              t(`jobTypeLabels.${jobType as JobType}`)
            )}
          />
        </ListItem>
      </Grid>
      <TableButton
        fullWidth
        onClick={() => {
          selectOracle(oracle);
        }}
      >
        {t('worker.oraclesTable.seeJobs')}
      </TableButton>
    </Paper>
  );
}
