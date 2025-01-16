import { t } from 'i18next';
import { Grid } from '@mui/material';
import type { MRT_ColumnDef } from 'material-react-table';
import type { Oracle } from '@/modules/worker/services/oracles';
import { EvmAddress } from '@/modules/worker/components/jobs/evm-address';
import { Chips } from '@/shared/components/ui/chips';
import { TableButton } from '@/shared/components/ui/table-button';
import { type JobType } from '@/modules/smart-contracts/EthKVStore/config';

export const getOraclesTablesColumns = (
  selectOracle: (oracle: Oracle) => void
): MRT_ColumnDef<Oracle>[] => {
  return [
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
        const jobTypes: string[] = [];
        for (const jobType of row.original.jobTypes) {
          jobTypes.push(t(`jobTypeLabels.${jobType as JobType}`));
        }
        return <Chips data={jobTypes} />;
      },
    },
    {
      accessorKey: 'url',
      id: 'seeJobsAction',
      header: '',
      size: 100,
      enableSorting: false,
      Cell: (props) => {
        return (
          <Grid sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <TableButton
              onClick={() => {
                selectOracle(props.row.original);
              }}
            >
              {t('worker.oraclesTable.seeJobs')}
            </TableButton>
          </Grid>
        );
      },
    },
  ];
};
