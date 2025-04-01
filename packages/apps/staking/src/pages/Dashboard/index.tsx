import { FC } from 'react';
import { Box, Grid, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import BalanceCard from '../../components/BalanceCard';
import LockedAmountCard from '../../components/LockedAmountCard';
import PageWrapper from '../../components/PageWrapper';
import StakedAmountCard from '../../components/StakedAmountCard';
import WithdrawableAmountCard from '../../components/WithdrawableAmountCard';
import { OverviewIcon } from '../../icons';

const Dashboard: FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <PageWrapper>
      <Box className="violet-header" flex={1}>
        <Box
          display="flex"
          flexDirection="column"
          sx={{ mx: isMobile ? 4 : 6 }}
        >
          <Box
            sx={{
              mt: 3,
              mb: 5,
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: 2,
            }}
          >
            <OverviewIcon sx={{ width: 66, height: 66 }} />
            <Typography
              variant="h1"
              fontWeight="bold"
              color={theme.palette.white.main}
            >
              Staking Overview
            </Typography>
          </Box>
          <Grid
            container
            columnSpacing={isMobile ? 0 : 3}
            rowSpacing={isMobile ? 4 : 0}
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
              sm={6}
              md={4}
              display="flex"
              flexDirection="column"
              gap={3}
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
