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

export const OwnerPage: React.FC = (): React.ReactElement => {
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
