import { FC } from 'react';
import { Box, Grid, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import BalanceCard from '../../components/BalanceCard';
import LockedAmountCard from '../../components/LockedAmountCard';
import PageWrapper from '../../components/PageWrapper';
import StakedAmountCard from '../../components/StakedAmountCard';
import WithdrawableAmountCard from '../../components/WithdrawableAmountCard';
import { DarkOverviewIcon, OverviewIcon } from '../../icons';

const Dashboard: FC = () => {
  const { isDarkMode, breakpoints, palette } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  return (
    <PageWrapper>
      <Box
        display="flex"
        flexDirection="column"
        minHeight="calc(100dvh - 212px)"
        overflow="hidden"
        mx={{ xs: -3, sm: 0 }}
        borderRadius={{ xs: 0, sm: '20px' }}
      >
        <Box
          display="flex"
          flexDirection="column"
          height="222px"
          px={{ xs: 4, md: 6, lg: 8 }}
          py={{ xs: 2, sm: 4 }}
          sx={{
            background: isDarkMode
              ? palette.elevation.light
              : palette.primary.main,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              mt: 3,
              gap: 2,
            }}
          >
            {isDarkMode ? (
              <DarkOverviewIcon sx={{ width: 66, height: 66 }} />
            ) : (
              <OverviewIcon sx={{ width: 66, height: 66 }} />
            )}
            <Typography
              variant="h1"
              fontSize={28}
              color={isDarkMode ? 'text.primary' : 'primary.contrastText'}
            >
              Staking Overview
            </Typography>
          </Box>
        </Box>
        <Box
          display="flex"
          flex={1}
          px={{ xs: 4, md: 6, lg: 8 }}
          py={{ xs: 4, sm: 0 }}
          sx={{
            background: isDarkMode
              ? palette.elevation.dark
              : palette.background.grey,
          }}
        >
          <Grid
            container
            columnSpacing={isMobile ? 0 : 3}
            rowSpacing={isMobile ? 4 : 0}
            mt={isMobile ? -12 : -6}
          >
            <Grid item xs={12} sm={6} md={4} pl={0}>
              <BalanceCard />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StakedAmountCard />
            </Grid>
            <Grid
              item
              xs={12}
              sm={12}
              md={4}
              display="flex"
              flexDirection={{ xs: 'column', sm: 'row', md: 'column' }}
              gap={3}
              mt={{ xs: 0, sm: 4, md: 0 }}
            >
              <LockedAmountCard />
              <WithdrawableAmountCard />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </PageWrapper>
  );
};

export default Dashboard;
