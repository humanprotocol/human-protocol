import {
  Box,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import addressSvg from 'src/assets/address.svg';
import { PageWrapper, ViewTitle } from 'src/components';
import { CardTextRow } from 'src/components/Cards';
import { CardContainer } from 'src/components/Cards/Container';
import { CopyAddressButton } from 'src/components/CopyAddressButton';
import { NetworkSelect } from 'src/components/NetworkSelect';
import { ESCROW_NETWORKS } from 'src/constants';
import { AppState } from 'src/state';
import { useFetchLeaderData, useLeaderByAddress } from 'src/state/leader/hooks';

const DATA = [
  {
    escrow: '0xF0245F6251Bef9447A08766b9DA2B07b28aD80B0',
    stake: 30000,
    payouts: 1000,
    status: 'Launched',
  },
];

export const LeaderDetailPage: React.FC = (): React.ReactElement => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { chainId, address } = useParams();

  useFetchLeaderData(chainId, address);

  const { currentLeader, currentLeaderLoaded } = useSelector(
    (state: AppState) => state.leader
  );

  return (
    <PageWrapper>
      {!currentLeaderLoaded ? (
        <Box display="flex" justifyContent="center" alignItems="center">
          <CircularProgress />
        </Box>
      ) : !currentLeader ? (
        <Box>Not Found</Box>
      ) : (
        <>
          <Box display="flex" alignItems="center" flexWrap="wrap">
            <ViewTitle title="Address" iconUrl={addressSvg} />
            {!isMobile && (
              <CopyAddressButton address={currentLeader.address} ml={6} />
            )}
            <Box ml="auto">
              <NetworkSelect value={currentLeader.chainId} disabled />
            </Box>
          </Box>
          {isMobile && (
            <Box mt={{ xs: 4, md: 6 }}>
              <CopyAddressButton address={currentLeader.address} />
            </Box>
          )}
          <Grid container spacing={4} mt={{ xs: 0, md: 4 }}>
            <Grid item xs={12} sm={6}>
              <CardContainer densed>
                <Typography
                  variant="body2"
                  color="primary"
                  fontWeight={600}
                  sx={{ mb: 2 }}
                >
                  Overview
                </Typography>
                <Stack spacing={2}>
                  <CardTextRow label="Role" value={currentLeader?.role} />
                  <CardTextRow
                    label="Network"
                    value={ESCROW_NETWORKS[currentLeader.chainId]?.title}
                  />
                  <CardTextRow label="World Rank" value="#1003" />
                  <CardTextRow
                    label="Reputation"
                    value={currentLeader.reputation.toLocaleString()}
                  />
                  <CardTextRow
                    label="Jobs Launched"
                    value={currentLeader.amountJobsLaunched.toLocaleString()}
                  />
                </Stack>
              </CardContainer>
            </Grid>
            <Grid item xs={12} sm={6}>
              <CardContainer densed>
                <Typography
                  variant="body2"
                  color="primary"
                  fontWeight={600}
                  sx={{ mb: 2 }}
                >
                  Stake info
                </Typography>
                <Stack spacing={2}>
                  <CardTextRow
                    label="Tokens staked"
                    value={`${currentLeader.amountStaked.toLocaleString()} HMT`}
                  />
                  <CardTextRow
                    label="Tokens allocated"
                    value={`${currentLeader.amountAllocated.toLocaleString()} HMT`}
                  />
                  <CardTextRow
                    label="Tokens locked"
                    value={`${currentLeader.amountLocked.toLocaleString()} HMT`}
                  />
                  <CardTextRow
                    label="Tokens locked until"
                    value={
                      currentLeader.lockedUntilTimestamp
                        ? new Date(
                            currentLeader.lockedUntilTimestamp
                          ).toDateString()
                        : 'N/A'
                    }
                  />
                </Stack>
              </CardContainer>
            </Grid>
          </Grid>
          <Box mt={4}>
            <Typography mb={4} variant="h6" color="primary">
              Stakes
            </Typography>
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: '16px',
                boxShadow:
                  '0px 3px 1px -2px #E9EBFA, 0px 2px 2px rgba(233, 235, 250, 0.5), 0px 1px 5px rgba(233, 235, 250, 0.2);',
              }}
            >
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Escrow</TableCell>
                    <TableCell align="left">Stake</TableCell>
                    <TableCell align="left">Payouts</TableCell>
                    <TableCell align="left">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {DATA.map((item) => (
                    <TableRow
                      key={item.escrow}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell align="left">{item.escrow}</TableCell>
                      <TableCell align="left">{item.stake} HMT</TableCell>
                      <TableCell align="left">{item.payouts} HMT</TableCell>
                      <TableCell align="left">{item.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}
    </PageWrapper>
  );
};
