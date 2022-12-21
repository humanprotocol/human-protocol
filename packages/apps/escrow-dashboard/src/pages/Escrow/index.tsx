import {
  Box,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import * as React from 'react';
import addressSvg from 'src/assets/address.svg';
import { PageWrapper, ViewTitle } from 'src/components';
import { CardTextRow } from 'src/components/Cards';
import { CardContainer } from 'src/components/Cards/Container';
import { CopyAddressButton } from 'src/components/CopyAddressButton';
import { NetworkSelect } from 'src/components/NetworkSelect';

export const EscrowDetailPage: React.FC = (): React.ReactElement => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <PageWrapper>
      <Box display="flex" alignItems="center" flexWrap="wrap">
        <ViewTitle title="Address" iconUrl={addressSvg} />
        {!isMobile && (
          <CopyAddressButton
            address="0xF0245F6251Bef9447A08766b9DA2B07b28aD80B0"
            ml={6}
          />
        )}
        <Box ml="auto">
          <NetworkSelect />
        </Box>
      </Box>
      {isMobile && (
        <Box mt={{ xs: 4, md: 6 }}>
          <CopyAddressButton address="0xF0245F6251Bef9447A08766b9DA2B07b28aD80B0" />
        </Box>
      )}
      <Grid container spacing={4} mt={{ xs: 0, md: 4 }}>
        <Grid item xs={12} md={6}>
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
        <Grid item xs={12} md={6}>
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
