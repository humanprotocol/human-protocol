import { useMemo } from 'react';
import { t } from 'i18next';
import { Grid } from '@mui/material';
import type { MRT_ColumnDef } from 'material-react-table';
import { Chips } from '@/shared/components/ui/chips';
import { TableButton } from '@/shared/components/ui/table-button';
import { type JobType } from '@/modules/smart-contracts/EthKVStore/config';
import { EvmAddress } from '../../jobs/components';
import { type Oracle } from '../../hooks';
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
        accessorKey: 'jobTypes',
        header: t('worker.oraclesTable.jobTypes'),
        size: 100,
        enableSorting: false,
        Cell: ({ row }) => {
          const jobTypes = row.original.jobTypes.map((jobType) =>
            t(`jobTypeLabels.${jobType as JobType}`)
          );
          return <Chips data={jobTypes} />;
        },
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
