import { Close as CloseIcon } from '@mui/icons-material';
import {
  Box,
  Checkbox,
  Drawer,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Paper,
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
import { FC, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ChainId,
  ESCROW_NETWORKS,
  ROLES,
  SUPPORTED_CHAIN_IDS,
} from 'src/constants';
import { useLeadersByChainID } from 'src/state/leader/hooks';
import { shortenAddress } from 'src/utils';

type LeaderboardViewProps = {
  showAll?: boolean;
  filterOpen?: boolean;
  openFilter?: () => void;
  closeFilter?: () => void;
};

export const LeaderboardView: FC<LeaderboardViewProps> = ({
  showAll = true,
  filterOpen = false,
  openFilter,
  closeFilter,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedRoles, setSelectedRoles] = useState<string[]>(ROLES);
  const [selectedNetworks, setSelectedNetworks] =
    useState<ChainId[]>(SUPPORTED_CHAIN_IDS);

  const leaders = useLeadersByChainID();

  const navigate = useNavigate();

  const displayRows = useMemo(() => {
    if (!leaders) return [];
    if (!showAll) return leaders.slice(0, 5);
    return leaders.filter(
      (s) =>
        selectedNetworks.includes(s.chainId) &&
        (selectedRoles.includes(s.role) || !s.role)
    );
  }, [showAll, selectedRoles, selectedNetworks, leaders]);

  const handleRoleCheckbox = (role: string) => (e: any) => {
    if (e.target.checked) {
      setSelectedRoles([...selectedRoles, role]);
    } else {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    }
  };

  const handleNetworkCheckbox = (chainId: ChainId) => (e: any) => {
    if (e.target.checked) {
      setSelectedNetworks([...selectedNetworks, chainId]);
    } else {
      setSelectedNetworks(selectedNetworks.filter((id) => id !== chainId));
    }
  };

  const handleClickLeader = (chainId: ChainId, address: string) => {
    navigate(`/leader/${chainId}/${address}`);
  };

  const renderFilter = (isMobile = false) => {
    return (
      <>
        <Box>
          <Typography
            color="textSecondary"
            variant="body2"
            sx={{ pl: isMobile ? 0 : 5, py: 1 }}
          >
            Network
          </Typography>
          <FormGroup>
            {SUPPORTED_CHAIN_IDS.map((chainId, i) => (
              <FormControlLabel
                componentsProps={{ typography: { color: 'textPrimary' } }}
                control={
                  <Checkbox
                    onChange={handleNetworkCheckbox(chainId)}
                    checked={selectedNetworks.includes(chainId)}
                  />
                }
                label={ESCROW_NETWORKS[chainId]?.title}
                key={chainId}
              />
            ))}
          </FormGroup>
        </Box>
        <Box>
          <Typography
            color="textSecondary"
            variant="body2"
            sx={{ pl: isMobile ? 0 : 5, py: 1 }}
          >
            Role
          </Typography>
          <FormGroup>
            {ROLES.map((role) => (
              <FormControlLabel
                key={role}
                componentsProps={{ typography: { color: 'textPrimary' } }}
                control={
                  <Checkbox
                    onChange={handleRoleCheckbox(role)}
                    checked={selectedRoles.includes(role)}
                  />
                }
                label={role}
              />
            ))}
          </FormGroup>
        </Box>
      </>
    );
  };

  return (
    <>
      <Grid container>
        {showAll && !isMobile && (
          <Grid item xs={12} md={3} lg={2}>
            {renderFilter()}
          </Grid>
        )}
        <Grid item xs={12} md={showAll ? 9 : 12} lg={showAll ? 10 : 12}>
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
                  <TableCell>Address</TableCell>
                  <TableCell align="left">Role</TableCell>
                  <TableCell align="left">Stake</TableCell>
                  <TableCell align="left">Reputation</TableCell>
                  <TableCell align="left">Reward</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayRows.map((staker) => (
                  <TableRow
                    key={`${staker.chainId}-${staker.address}`}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      handleClickLeader(staker.chainId, staker.address)
                    }
                  >
                    <TableCell component="th" scope="row">
                      {shortenAddress(staker.address)}
                    </TableCell>
                    <TableCell align="left">{staker.role}</TableCell>
                    <TableCell align="left">
                      {staker.amountStaked} HMT
                    </TableCell>
                    <TableCell align="left">{staker.reputation}</TableCell>
                    <TableCell align="left">0 HMT</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
      <Drawer anchor="right" open={filterOpen} onClose={closeFilter}>
        <Box px={2} pt={8}>
          <Box mb={10} textAlign="right">
            <IconButton onClick={closeFilter}>
              <CloseIcon color="primary" />
            </IconButton>
          </Box>
          {renderFilter(true)}
        </Box>
      </Drawer>
    </>
  );
};
