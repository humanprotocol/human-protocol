import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import * as React from 'react';
import addressSvg from 'src/assets/address.svg';
import { PageWrapper, ViewTitle } from 'src/components';
import { CardTextRow } from 'src/components/Cards';
import { CardContainer } from 'src/components/Cards/Container';
import { CopyAddressButton } from 'src/components/CopyAddressButton';
import { ESCROW_NETWORKS, SUPPORTED_CHAIN_IDS } from 'src/constants';

const DATA = [
  {
    escrow: '0xF0245F6251Bef9447A08766b9DA2B07b28aD80B0',
    stake: 30000,
    payouts: 1000,
    status: 'Launched',
  },
  {
    escrow: '0xF0245F6251Bef9447A08766b9DA2B07b28aD80B0',
    stake: 30000,
    payouts: 1000,
    status: 'Launched',
  },
  {
    escrow: '0xF0245F6251Bef9447A08766b9DA2B07b28aD80B0',
    stake: 30000,
    payouts: 1000,
    status: 'Launched',
  },
  {
    escrow: '0xF0245F6251Bef9447A08766b9DA2B07b28aD80B0',
    stake: 30000,
    payouts: 1000,
    status: 'Launched',
  },
  {
    escrow: '0xF0245F6251Bef9447A08766b9DA2B07b28aD80B0',
    stake: 30000,
    payouts: 1000,
    status: 'Launched',
  },
];

export const ProfilePage: React.FC = (): React.ReactElement => {
  return (
    <PageWrapper>
      <Box display="flex" alignItems="center">
        <ViewTitle title="Address" iconUrl={addressSvg} />
        <CopyAddressButton
          address="0xF0245F6251Bef9447A08766b9DA2B07b28aD80B0"
          ml={6}
        />
        <Box ml="auto">
          <FormControl variant="standard" sx={{ m: 1, minWidth: 220 }}>
            <InputLabel id="newtork-select-label">Network</InputLabel>
            <Select
              labelId="network-select-label"
              id="network-select"
              label="Network"
            >
              {SUPPORTED_CHAIN_IDS.map((chainId) => (
                <MenuItem value={chainId} key={chainId}>
                  {ESCROW_NETWORKS[chainId]?.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
      <Grid container spacing={4} mt={4}>
        <Grid item xs={12} sm={6}>
          <CardContainer densed>
            <Typography
              variant="body2"
              color="primary"
              fontWeight={600}
              sx={{ mb: 2 }}
            >
              Escrow details
            </Typography>
            <Stack spacing={2}>
              <CardTextRow
                label="Manifest URL"
                value="https://job-laucher.ai"
              />
              <CardTextRow
                label="Manifest Hash"
                value="0xe22647d4ae522f7545e7b4dda8c967"
              />
              <CardTextRow label="Balance of" value="2,000 HMT" />
              <CardTextRow label="Paid Out HMT" value="390 HMT" />
              <CardTextRow label="Amount of Jobs" value="200" />
              <CardTextRow label="Workers assigned" value="10" />
            </Stack>
          </CardContainer>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Stack spacing={4}>
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
                <CardTextRow label="Role" value="Operator (Job Launcher)" />
                <CardTextRow label="World Rank" value="#1003" />
                <CardTextRow label="Reputation" value="3403" />
                <CardTextRow label="Jobs Launched" value="15" />
              </Stack>
            </CardContainer>
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
                  label="Tokens locked for withdrawal"
                  value="300 HMT"
                />
                <CardTextRow label="Tokens locked until" value="02/02/2023" />
              </Stack>
            </CardContainer>
          </Stack>
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
    </PageWrapper>
  );
};
