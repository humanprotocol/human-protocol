import {
  Box,
  Button,
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
import { FC } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import addressSvg from 'src/assets/address.svg';
import {
  CardContainer,
  CardTextRow,
  CopyAddressButton,
  NetworkSelect,
  PageWrapper,
  ViewTitle,
} from 'src/components';
import { ESCROW_NETWORKS } from 'src/constants';
import { AppState } from 'src/state';
import { useFetchLeaderData } from 'src/state/leader/hooks';

export const LeaderDetail: FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { chainId, address } = useParams();

  useFetchLeaderData(chainId, address);

  const {
    currentLeader,
    currentLeaderLoaded,
    leaderEscrowsLoaded,
    leaderEscrows,
  } = useSelector((state: AppState) => state.leader);

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
          <Box
            display="flex"
            alignItems="center"
            flexWrap="wrap"
            gap={{ xs: 3, sm: 4 }}
          >
            <ViewTitle title="Address" iconUrl={addressSvg} />
            {!isMobile && <CopyAddressButton address={currentLeader.address} />}
            {!isMobile ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                flex={1}
              >
                <NetworkSelect value={currentLeader.chainId} disabled />
                {currentLeader.url && (
                  <Button
                    href={currentLeader.url}
                    target="_blank"
                    variant="outlined"
                    sx={{ minWidth: 240 }}
                  >
                    Exchange
                  </Button>
                )}
              </Box>
            ) : (
              <Box ml="auto">
                <NetworkSelect value={currentLeader.chainId} disabled />
              </Box>
            )}
          </Box>
          {isMobile && (
            <Box mt={{ xs: 4, md: 6 }}>
              <CopyAddressButton address={currentLeader.address} />
              {currentLeader.url && (
                <Button
                  href={currentLeader.url}
                  target="_blank"
                  variant="outlined"
                  sx={{ mt: 3 }}
                  fullWidth
                >
                  Exchange
                </Button>
              )}
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
              Escrows
            </Typography>
            {!leaderEscrowsLoaded ? (
              <Box display="flex" justifyContent="center" alignItems="center">
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: '16px',
                  boxShadow:
                    '0px 3px 1px -2px #E9EBFA, 0px 2px 2px rgba(233, 235, 250, 0.5), 0px 1px 5px rgba(233, 235, 250, 0.2);',
                }}
              >
                {!leaderEscrows?.length ? (
                  <Box padding={2} display="flex" justifyContent="center">
                    No escrows launched yet
                  </Box>
                ) : (
                  <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Escrow</TableCell>
                        <TableCell align="left">Allocated</TableCell>
                        <TableCell align="left">Payouts</TableCell>
                        <TableCell align="left">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaderEscrows.map((escrow) => (
                        <TableRow
                          key={escrow.address}
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                          }}
                        >
                          <TableCell align="left">{escrow.address}</TableCell>
                          <TableCell align="left">
                            {escrow.amountAllocated} HMT
                          </TableCell>
                          <TableCell align="left">
                            {escrow.amountPayout} HMT
                          </TableCell>
                          <TableCell align="left">{escrow.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TableContainer>
            )}
          </Box>
        </>
      )}
    </PageWrapper>
  );
};
