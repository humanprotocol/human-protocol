import { Box, Typography } from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { LeaderBoardData } from '@services/api/use-leaderboard-details';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';
import { useLeaderboardSearch } from '@utils/hooks/use-leaderboard-search';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CustomTooltip from '@components/CustomTooltip';
import { colorPalette } from '@assets/styles/color-palette';
import { useMemo } from 'react';

import { RoleCell } from '../components/RoleCell';
import { AddressCell } from '../components/AddressCell';
import { ChainCell } from '../components/ChainCell';
import { SelectNetwork } from '../components/SelectNetwork';
import { ReputationLabel } from '../components/ReputationLabel';
import { TextCell } from '../components/TextCell';

export const useDataGrid = (data: LeaderBoardData) => {
  const {
    filterParams: { chainId },
  } = useLeaderboardSearch();

  const {
    mobile: { isMobile },
  } = useBreakPoints();
  const formattedData = useMemo(() => {
    return data.map((row, idx) => {
      return {
        ...row,
        id: row.address,
        rowIndex: idx,
      };
    });
  }, [data]);

  const visibleRows = useMemo(() => {
    if (chainId !== -1) {
      return formattedData.filter((elem) => elem.chainId === chainId);
    }

    return formattedData;
  }, [formattedData, chainId]);

  const columns: GridColDef<(typeof visibleRows)[number]>[] = useMemo(
    () => [
      {
        field: 'role',
        sortable: false,
        flex: isMobile ? 0.8 : 1.5,
        minWidth: isMobile ? 100 : 240,
        headerClassName: isMobile
          ? 'home-page-table-header pinned-column--header'
          : 'home-page-table-header',
        cellClassName: isMobile ? 'pinned-column--cell' : '',
        renderHeader: () => (
          <Typography component="span" variant="body3">
            Role
          </Typography>
        ),
        renderCell: (params: GridRenderCellParams) => (
          <RoleCell role={params.value} />
        ),
      },
      {
        field: 'address',
        sortable: false,
        flex: 1,
        minWidth: 150,
        headerClassName: 'home-page-table-header',
        renderHeader: () => (
          <Box display="flex" gap="8px" alignItems="center">
            <CustomTooltip title="Address of the role" arrow>
              <HelpOutlineIcon
                style={{
                  color: colorPalette.sky.main,
                }}
              />
            </CustomTooltip>
            <Typography component="span" variant="body3">
              Address
            </Typography>
          </Box>
        ),
        renderCell: (params: GridRenderCellParams) => (
          <AddressCell chainId={params.row.chainId} address={params.value} />
        ),
      },
      {
        field: 'amountStaked',
        flex: 1,
        minWidth: 130,
        headerClassName: 'home-page-table-header',
        renderHeader: () => (
          <Box display="flex" gap="8px" alignItems="center">
            <CustomTooltip title="Amount of HMT staked" arrow>
              <HelpOutlineIcon
                style={{
                  color: colorPalette.sky.main,
                }}
              />
            </CustomTooltip>
            <Typography component="span" variant="body3">
              Stake
            </Typography>
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
        sortable: false,
        minWidth: isMobile ? 150 : 245,
        headerClassName: 'home-page-table-header',
        renderHeader: () => {
          return (
            <>
              {isMobile ? (
                <Typography component="span" variant="body3">
                  Network
                </Typography>
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
        field: 'reputation',
        headerName: 'Reputation Score',
        sortable: false,
        flex: 1,
        minWidth: 210,
        headerClassName: 'home-page-table-header',
        renderHeader: () => (
          <Box display="flex" gap="8px" alignItems="center">
            <CustomTooltip
              title="Reputation of the role as per their activities "
              arrow
            >
              <HelpOutlineIcon
                style={{
                  color: colorPalette.sky.main,
                }}
              />
            </CustomTooltip>
            <Typography component="span" variant="body3">
              Reputation Score
            </Typography>
          </Box>
        ),
        renderCell: (params: GridRenderCellParams) => (
          <ReputationLabel reputation={params.value} />
        ),
      },
      {
        field: 'fee',
        minWidth: 150,
        headerName: 'Operator Fee',
        headerClassName: 'home-page-table-header',
        renderHeader: () => (
          <Typography variant="body3" component="div">
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
    visibleRows,
  };
};
