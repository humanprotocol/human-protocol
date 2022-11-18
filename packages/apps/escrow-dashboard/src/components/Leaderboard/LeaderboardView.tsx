import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import useLeaderboardData from 'src/hooks/useLeaderboardData';
import { shortenAddress } from 'src/utils';

export const LeaderboardView = ({
  showAll = true,
}: {
  showAll?: boolean;
}): React.ReactElement => {
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  const stakers = useLeaderboardData();

  const displayRows = useMemo(() => {
    if (!stakers) return [];
    if (!showAll) return stakers.slice(0, 5);
    if (selectedRoles.length === 0) return stakers;
    return stakers.filter((s) => selectedRoles.includes(s.role));
  }, [showAll, selectedRoles, stakers]);

  const handleRoleCheckbox = (role: number) => (e: any) => {
    if (e.target.checked) {
      setSelectedRoles([...selectedRoles, role]);
    } else {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    }
  };

  return (
    <Grid container>
      {showAll && (
        <Grid item xs={12} sm={3} md={2}>
          <Typography
            color="textSecondary"
            variant="body2"
            sx={{ pl: 5, py: 1 }}
          >
            Role
          </Typography>
          <FormGroup>
            {ROLES.map((role, i) => (
              <FormControlLabel
                componentsProps={{ typography: { color: 'textPrimary' } }}
                control={<Checkbox onChange={handleRoleCheckbox(i + 1)} />}
                label={role}
              />
            ))}
          </FormGroup>
        </Grid>
      )}
      <Grid item xs={12} sm={showAll ? 9 : 12} md={showAll ? 10 : 12}>
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
                  key={staker.address}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {shortenAddress(staker.address)}
                  </TableCell>
                  <TableCell align="left">{ROLES[staker.role - 1]}</TableCell>
                  <TableCell align="left">
                    {staker.tokensStaked.toNumber()} HMT
                  </TableCell>
                  <TableCell align="left">0</TableCell>
                  <TableCell align="left">0 HMT</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
};
