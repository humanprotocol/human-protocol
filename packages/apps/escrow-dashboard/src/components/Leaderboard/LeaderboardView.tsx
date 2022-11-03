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
import React from 'react';
import { ROLES } from 'src/constants';

function createData(
  id: number,
  address: string,
  role: string,
  stake: number,
  reputation: number,
  reward: number
) {
  return { id, address, role, stake, reputation, reward };
}

const rows = [
  createData(1, '0x571e1ce87206f9...', ROLES[0], 30000, 4320, 1000),
  createData(2, '0x571e1ce87206f9...', ROLES[1], 30000, 4320, 1000),
  createData(3, '0x571e1ce87206f9...', ROLES[2], 30000, 4320, 1000),
  createData(4, '0x571e1ce87206f9...', ROLES[3], 30000, 4320, 1000),
  createData(5, '0x571e1ce87206f9...', ROLES[4], 30000, 4320, 1000),
];

export const LeaderboardView: React.FC = (): React.ReactElement => {
  return (
    <Grid container>
      <Grid item xs={12} sm={3} md={2}>
        <Typography color="textSecondary" variant="body2" sx={{ pl: 5, py: 1 }}>
          Role
        </Typography>
        <FormGroup>
          {ROLES.map((role) => (
            <FormControlLabel
              componentsProps={{ typography: { color: 'textPrimary' } }}
              control={<Checkbox />}
              label={role}
            />
          ))}
        </FormGroup>
      </Grid>
      <Grid item xs={12} sm={9} md={10}>
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
                <TableCell />
                <TableCell>Address</TableCell>
                <TableCell align="left">Role</TableCell>
                <TableCell align="left">Stake</TableCell>
                <TableCell align="left">Reputation</TableCell>
                <TableCell align="left">Reward</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell align="center">{row.id}</TableCell>
                  <TableCell component="th" scope="row">
                    {row.address}
                  </TableCell>
                  <TableCell align="left">{row.role}</TableCell>
                  <TableCell align="left">{row.stake} HMT</TableCell>
                  <TableCell align="left">{row.reputation}</TableCell>
                  <TableCell align="left">{row.reward} HMT</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
};
