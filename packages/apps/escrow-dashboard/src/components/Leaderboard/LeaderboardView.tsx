import { ChainId, NETWORKS } from '@human-protocol/sdk';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { FC, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { CardContainer } from '../Cards';
import { ViewTitle } from '../ViewTitle';
import userSvg from 'src/assets/user.svg';
import { ROLES, V2_SUPPORTED_CHAIN_IDS } from 'src/constants';
import { AppState } from 'src/state';
import { useLeadersData, useLeadersByChainID } from 'src/state/leader/hooks';
import { shortenAddress } from 'src/utils';

type LeaderboardViewProps = {
  showAll?: boolean;
};

export const LeaderboardView: FC<LeaderboardViewProps> = ({
  showAll = true,
}) => {
  const { leadersLoaded } = useSelector((state: AppState) => state.leader);

  useLeadersData();

  const leaders = useLeadersByChainID();

  const navigate = useNavigate();

  const displayRows = useMemo(() => {
    if (!leaders) return [];
    if (!showAll) return leaders.slice(0, 5);
    return leaders.filter(
      (s) =>
        V2_SUPPORTED_CHAIN_IDS.includes(s.chainId) &&
        (ROLES.includes(s.role) || !s.role)
    );
  }, [showAll, leaders]);

  const handleClickLeader = (chainId: ChainId, address: string) => {
    navigate(`/leader/${chainId}/${address}`);
  };

  return (
    <Box mt={13}>
      <Box display="flex" alignItems="center" flexWrap="wrap">
        <ViewTitle title="Leaderboard" iconUrl={userSvg} />
        {!showAll && (
          <Button
            variant="outlined"
            sx={{ ml: { xs: 'auto', sm: 3 }, mr: { xs: 'auto', sm: 0 } }}
            href="/leaderboard"
          >
            See More
          </Button>
        )}
      </Box>
      <Box mt={{ xs: 4, md: 8 }}>
        {leadersLoaded ? (
          <CardContainer sxProps={{ padding: '42px 52px 28px' }}>
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table
                sx={{
                  minWidth: 650,
                  th: {
                    fontSize: '12px',
                    border: 'none',
                    background: '#F6F5FC',
                    textTransform: 'uppercase',
                    ':first-child': { borderBottomLeftRadius: '4px' },
                    ':last-child': { borderBottomRightRadius: '4px' },
                  },
                  td: { border: 'none' },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap="10px">
                        Operator
                        <Chip label="on HUMAN Protocol" size="small" />
                      </Box>
                    </TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Stake</TableCell>
                    <TableCell>
                      <FormControl sx={{ minWidth: 210 }} size="small">
                        <InputLabel id="demo-select-small-label">
                          By Network
                        </InputLabel>
                        <Select
                          labelId="demo-select-small-label"
                          id="demo-select-small"
                          label="By Network"
                        >
                          <MenuItem value={10}>Ten</MenuItem>
                          <MenuItem value={20}>Twenty</MenuItem>
                          <MenuItem value={30}>Thirty</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>Reputation Score</TableCell>
                    <TableCell>Operator Fee</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayRows.map((staker, i) => (
                    <TableRow
                      key={`${staker.chainId}-${staker.address}`}
                      sx={{ cursor: 'pointer' }}
                      onClick={() =>
                        handleClickLeader(staker.chainId, staker.address)
                      }
                    >
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{staker.role}</TableCell>
                      <TableCell>{shortenAddress(staker.address)}</TableCell>
                      <TableCell>{staker.amountStaked} HMT</TableCell>
                      <TableCell>{NETWORKS[staker.chainId]?.title}</TableCell>
                      <TableCell>{staker.reputation}</TableCell>
                      <TableCell>0 HMT</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContainer>
        ) : (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress size={36} />
          </Box>
        )}
      </Box>
    </Box>
  );
};
