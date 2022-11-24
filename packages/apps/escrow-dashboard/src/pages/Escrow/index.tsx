import {
  Box,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import * as React from 'react';
import addressSvg from 'src/assets/address.svg';
import { PageWrapper, ViewTitle } from 'src/components';
import { CardTextRow } from 'src/components/Cards';
import { CardContainer } from 'src/components/Cards/Container';
import CopyLinkIcon from 'src/components/Icons/CopyLinkIcon';
import { ESCROW_NETWORKS, SUPPORTED_CHAIN_IDS } from 'src/constants';

export const EscrowDetailPage: React.FC = (): React.ReactElement => {
  return (
    <PageWrapper>
      <Box display="flex" alignItems="center">
        <ViewTitle title="Address" iconUrl={addressSvg} />
        <Box display="flex" alignItems="center" ml={3}>
          <Typography color="primary" variant="h5">
            0xF0245F6251Bef9447A08766b9DA2B07b28aD80B0
          </Typography>
          <IconButton color="primary">
            <CopyLinkIcon />
          </IconButton>
        </Box>
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
          <CardContainer densed>
            <Typography
              variant="body2"
              color="primary"
              fontWeight={600}
              sx={{ mb: 2 }}
            >
              Stake details
            </Typography>
            <Stack spacing={2}>
              <CardTextRow
                label="Staker"
                value="0xe22647d4ae522f7545e7b4dda8c967"
              />
              <CardTextRow label="Staked HMT" value="2,000 HMT" />
              <CardTextRow label="Slashed HMT" value="0 HMT" />
            </Stack>
          </CardContainer>
        </Grid>
      </Grid>
    </PageWrapper>
  );
};
