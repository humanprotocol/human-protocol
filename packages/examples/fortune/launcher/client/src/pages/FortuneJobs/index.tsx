import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Box from '@mui/material/Box';
import React, { useState } from 'react';
import fortuneImg from 'src/assets/fortune.png';

const DATA = [
  {
    id: 1,
    escrow: '0xF0245F6251Bef9447A08766b9DA2B07b28aD80B0',
    title: 'Title here lorem ipsum dolor sit ',
    fortunes: 10,
    fund: 10,
    status: 'Launched',
  },
  {
    id: 2,
    escrow: '0xF0245F6251Bef9447A08766b9DA2B07b28aD80B0',
    title: 'Title here lorem ipsum dolor sit ',
    fortunes: 10,
    fund: 10,
    status: 'Launched',
  },
  {
    id: 3,
    escrow: '0xF0245F6251Bef9447A08766b9DA2B07b28aD80B0',
    title: 'Title here lorem ipsum dolor sit ',
    fortunes: 10,
    fund: 10,
    status: 'Launched',
  },
  {
    id: 4,
    escrow: '0xF0245F6251Bef9447A08766b9DA2B07b28aD80B0',
    title: 'Title here lorem ipsum dolor sit ',
    fortunes: 10,
    fund: 10,
    status: 'Launched',
  },
  {
    id: 5,
    escrow: '0xF0245F6251Bef9447A08766b9DA2B07b28aD80B0',
    title: 'Title here lorem ipsum dolor sit ',
    fortunes: 10,
    fund: 10,
    status: 'Launched',
  },
];

export default function FortuneJobsPage() {
  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }, pt: 10 }}>
      <Box
        sx={{
          background: '#f6f7fe',
          borderRadius: {
            xs: '16px',
            sm: '16px',
            md: '24px',
            lg: '32px',
            xl: '40px',
          },
          padding: {
            xs: '24px 16px',
            md: '42px 54px',
            lg: '56px 72px',
            xl: '70px 90px',
          },
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
        >
          <Typography variant="h4" fontWeight={600}>
            Fortune Jobs
          </Typography>
          <Button variant="outlined">Back</Button>
        </Box>
        <Box
          sx={{
            background: '#F9FAFF',
            borderRadius: '8px',
            display: 'flex',
            padding: 2.5,
            alignItems: 'center',
            mt: 4.5,
          }}
        >
          <img
            src={fortuneImg}
            alt="fortune"
            style={{ width: 36, height: 22 }}
          />
          <Typography variant="body2" ml={1}>
            These are Fortune Requests with pending jobs, you can submit by
            clicking Submit
          </Typography>
        </Box>
        <TableContainer
          sx={{ borderRadius: '4px', background: '#fff', mt: 2.5 }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ th: { borderBottom: '1px solid #320A8D' } }}>
                <TableCell></TableCell>
                <TableCell>Escrow</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Fortunes Required</TableCell>
                <TableCell>Fund Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {DATA.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{
                    'th,td': { borderBottom: '1px solid #CACFE8' },
                    '&:last-child td, &:last-child th': { border: 0 },
                  }}
                >
                  <TableCell component="th" scope="row">
                    {row.id}
                  </TableCell>
                  <TableCell align="left">{row.escrow}</TableCell>
                  <TableCell align="left">{row.title}</TableCell>
                  <TableCell align="left">{row.fortunes}</TableCell>
                  <TableCell align="left">{row.fund} HMT</TableCell>
                  <TableCell align="left">{row.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
