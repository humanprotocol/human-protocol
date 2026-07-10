import { Stack, Paper, type SxProps, Typography } from '@mui/material';
import { t } from 'i18next';
import { Chips } from '@/shared/components/ui/chips';
import { TableButton } from '@/shared/components/ui/table-button';
import { ListItem } from '@/shared/components/ui/list-item';
import type { JobType } from '@/modules/smart-contracts/EthKVStore/config';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useSelectOracleNavigation } from '../hooks/use-select-oracle-navigation';
import { EvmAddress } from '../../jobs/components';
import { type Oracle } from '../../services/oracles.service';

interface OraclesTableItemMobileProps {
  oracle: Oracle;
}

const styles: SxProps = {
  px: 2,
  py: 4,
  mb: 2.5,
  borderRadius: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  boxShadow: 'none',
};

export function OraclesTableItemMobile({
  oracle,
}: Readonly<OraclesTableItemMobileProps>) {
  const { colorPalette } = useColorMode();
  const { selectOracle } = useSelectOracleNavigation();

  return (
    <Paper sx={{ ...styles, backgroundColor: colorPalette.backgroundColor }}>
      <Stack>
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
      </Stack>
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
