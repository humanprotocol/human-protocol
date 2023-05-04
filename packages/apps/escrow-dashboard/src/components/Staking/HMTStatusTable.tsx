import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { PolygonIcon } from '../Icons';

export const HMTStatusTable = () => {
  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
      <Paper
        sx={{
          width: '100%',
          borderRadius: '16px',
          boxShadow:
            '0px 3px 1px -2px #E9EBFA, 0px 2px 2px rgba(233, 235, 250, 0.5), 0px 1px 5px rgba(233, 235, 250, 0.2)',
          pt: 2,
        }}
      >
        <TableContainer>
          <Table
            aria-labelledby="tableTitle"
            sx={{
              minWidth: 750,
              th: { fontWeight: 600, borderBottomColor: '#320A8D' },
              td: {
                ':nth-child(odd)': {
                  color: '#858EC6',
                },
              },
              'th,td': {
                py: 2,
                '&:first-of-type': {
                  paddingLeft: '38px',
                },
                '&:last-of-type': {
                  paddingLeft: '38px',
                },
              },
              'tr:last-child': {
                td: {
                  borderBottom: 'none',
                },
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell colSpan={4}>HMT Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Allocated:</TableCell>
                <TableCell>800 HMT</TableCell>
                <TableCell>$0.00</TableCell>
                <TableCell>
                  <Button variant="text" color="primary">
                    View escrows
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Locked:</TableCell>
                <TableCell>200 HMT</TableCell>
                <TableCell>$0.00</TableCell>
                <TableCell>
                  <Button variant="text" color="primary">
                    View escrows
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Available:</TableCell>
                <TableCell>2,300 HMT</TableCell>
                <TableCell>$0.00</TableCell>
                <TableCell>
                  <Button variant="text" color="primary">
                    Withdraw
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Staked:</TableCell>
                <TableCell>5,400 HMT</TableCell>
                <TableCell>$0.00</TableCell>
                <TableCell>
                  <Box
                    sx={{
                      background: '#f9faff',
                      borderRadius: '4px',
                      padding: '9px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      ml: 1,
                    }}
                  >
                    <PolygonIcon
                      color="primary"
                      sx={{ fontSize: '1rem', mr: '4px' }}
                    />
                    <Typography
                      color="primary"
                      variant="caption"
                      sx={{ textTransform: 'uppercase' }}
                    >
                      Polygon
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};
