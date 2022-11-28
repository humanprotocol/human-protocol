import {
  Box,
  FormControl,
  Grid,
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
import { CopyAddressButton } from 'src/components/CopyAddressButton';
import { ESCROW_NETWORKS, SUPPORTED_CHAIN_IDS } from 'src/constants';

export const OwnerPage: React.FC = (): React.ReactElement => {
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
              Overview
            </Typography>
            <Stack spacing={2}>
              <CardTextRow label="Role" value="Owner" />
              <CardTextRow label="Jobs Launched" value="15,064" />
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
              <CardTextRow label="Toekns staked" value="89,000 HMT" />
            </Stack>
          </CardContainer>
        </Grid>
      </Grid>
    </PageWrapper>
  );
};
