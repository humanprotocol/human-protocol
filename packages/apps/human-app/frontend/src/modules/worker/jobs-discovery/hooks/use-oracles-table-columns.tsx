import { useMemo } from 'react';
import { t } from 'i18next';
import { Grid } from '@mui/material';
import type { MRT_ColumnDef } from 'material-react-table';
import { TableButton } from '@/shared/components/ui/table-button';
import { EvmAddress } from '../../jobs/components';
import { type Oracle } from '../../services/oracles.service';
import { useSelectOracleNavigation } from './use-select-oracle-navigation';

export const useOraclesTableColumns = (): MRT_ColumnDef<Oracle>[] => {
  const { selectOracle } = useSelectOracleNavigation();

  return useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('worker.oraclesTable.annotationTool'),
        size: 100,
        enableSorting: false,
      },
      {
        accessorKey: 'address',
        header: t('worker.oraclesTable.oracleAddress'),
        size: 100,
        enableSorting: true,
        Cell: (props) => <EvmAddress address={props.row.original.address} />,
      },
      {
        accessorKey: 'url',
        id: 'seeJobsAction',
        header: '',
        size: 100,
        enableSorting: false,
        Cell: (props) => (
          <Grid sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <TableButton
              onClick={() => {
                selectOracle(props.row.original);
              }}
            >
              {t('worker.oraclesTable.seeJobs')}
            </TableButton>
          </Grid>
        ),
      },
    ],
    [selectOracle]
  );
};
