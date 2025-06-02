import { useMemo } from 'react';

import { Box, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import CustomTooltip from '@/components/CustomTooltip';
import { RoleCell } from '../components/RoleCell';
import { AddressCell } from '../components/AddressCell';
import { ChainCell } from '../components/ChainCell';
import { SelectNetwork } from '../components/SelectNetwork';
import { TextCell } from '../components/TextCell';
import { CategoryCell } from '../components/CategoryCell';

import { LeaderBoardData } from '@/services/api/use-leaderboard-details';
import { useIsMobile } from '@/utils/hooks/use-breakpoints';
import { useLeaderboardSearch } from '@/utils/hooks/use-leaderboard-search';

const InfoTooltip = ({ title }: { title: string }) => (
  <CustomTooltip title={title} arrow>
    <HelpOutlineIcon
      sx={{
        color: 'text.secondary',
      }}
    />
  </CustomTooltip>
);

const useDataGrid = (data: LeaderBoardData) => {
  const {
    filterParams: { chainId },
  } = useLeaderboardSearch();

  const isMobile = useIsMobile();

  const formattedData = useMemo(() => {
    return data.map((row, idx) => {
      return {
        ...row,
        id: `${row.address}${row.chainId}`,
        rowIndex: idx,
      };
    });
  }, [data]);

  const rows = useMemo(() => {
    if (chainId !== -1) {
      return formattedData.filter((elem) => elem.chainId === chainId);
    }

    return formattedData;
  }, [formattedData, chainId]);

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'role',
        flex: 1.5,
        minWidth: isMobile ? 250 : 340,
        sortable: false,
        renderHeader: () => <Typography variant="body3">Role</Typography>,
        renderCell: (params: GridRenderCellParams) => (
          <RoleCell
            rank={params.row.rowIndex + 1}
            role={params.value}
            websiteUrl={params.row.website}
            name={params.row.name}
          />
        ),
      },
      {
        field: 'address',
        sortable: false,
        flex: 1,
        minWidth: isMobile ? 180 : 260,
        renderHeader: () => (
          <Box display="flex" alignItems="center" gap={1}>
            <InfoTooltip title="Address of the role" />
            <Typography variant="body3">Address</Typography>
          </Box>
        ),
        renderCell: (params: GridRenderCellParams) => (
          <AddressCell chainId={params.row.chainId} address={params.value} />
        ),
      },
      {
        field: 'amountStaked',
        sortable: false,
        flex: 1,
        minWidth: isMobile ? 130 : 260,
        renderHeader: () => (
          <Box display="flex" alignItems="center" gap={1}>
            <InfoTooltip title="Amount of HMT staked" />
            <Typography variant="body3">Stake</Typography>
          </Box>
        ),
        valueFormatter: (value: string) => {
          return `${value} HMT`;
        },
        renderCell: (params: GridRenderCellParams) => (
          <TextCell value={params.formattedValue} />
        ),
      },
      {
        field: 'chainId',
        headerName: 'Network',
        flex: isMobile ? 1 : 1.5,
        minWidth: isMobile ? 130 : 245,
        renderHeader: () => {
          return (
            <>
              {isMobile ? (
                <Typography variant="body3">Network</Typography>
              ) : (
                <SelectNetwork />
              )}
            </>
          );
        },
        renderCell: (params: GridRenderCellParams) => (
          <ChainCell chainId={params.value} />
        ),
      },
      {
        field: 'category',
        sortable: false,
        minWidth: isMobile ? 180 : 260,
        headerName: 'Category',
        renderHeader: () => <Typography variant="body3">Category</Typography>,
        renderCell: (params: GridRenderCellParams) => (
          <CategoryCell value={params.value} />
        ),
      },
      {
        field: 'fee',
        sortable: false,
        minWidth: isMobile ? 100 : 130,
        headerName: 'Operator Fee',
        renderHeader: () => (
          <Typography variant="body3" component="p">
            Operator Fee
          </Typography>
        ),
        valueFormatter: (value: string | null) => {
          if (value == null) {
            return '';
          }

          return `${value}%`;
        },
        renderCell: (params: GridRenderCellParams) => (
          <TextCell value={params.formattedValue} />
        ),
      },
    ],
    [isMobile]
  );

  return {
    columns,
    rows,
  };
};

export default useDataGrid;
