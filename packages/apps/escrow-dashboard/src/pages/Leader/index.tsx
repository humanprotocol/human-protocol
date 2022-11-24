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

export const LeaderDetailPage: React.FC = (): React.ReactElement => {
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
              Overview
            </Typography>
            <Stack spacing={2}>
              <CardTextRow label="Role" value="Operator (Job Launcher)" />
              <CardTextRow label="Network" value="Polygon" />
              <CardTextRow label="World Rank" value="#1003" />
              <CardTextRow label="Reputation" value="3403" />
              <CardTextRow label="Jobs Launched" value="15" />
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
              <CardTextRow label="Tokens staked" value="220,000 HMT" />
              <CardTextRow label="Tokens allocated" value="17,000 HMT" />
              <CardTextRow label="Tokens locked" value="3,000 HMT" />
              <CardTextRow label="Tokens locked until" value="02/02/2023" />
            </Stack>
          </CardContainer>
        </Grid>
      </Grid>
    </PageWrapper>
  );
};
