import {
  Box,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FC } from 'react';
import { useParams } from 'react-router-dom';

import addressSvg from 'src/assets/address.svg';
import {
  CardContainer,
  CardTextRow,
  CopyAddressButton,
  NetworkSelect,
  PageWrapper,
  ViewTitle,
} from 'src/components';

export const EscrowDetail: FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { chainId, address } = useParams();

  return (
    <PageWrapper>
      <Box display="flex" alignItems="center" flexWrap="wrap">
        <ViewTitle title="Address" iconUrl={addressSvg} />
        {!isMobile && <CopyAddressButton address={address || ''} ml={6} />}
        <Box ml="auto">
          <NetworkSelect value={chainId} disabled />
        </Box>
      </Box>
      {isMobile && (
        <Box mt={{ xs: 4, md: 6 }}>
          <CopyAddressButton address={address || ''} />
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
