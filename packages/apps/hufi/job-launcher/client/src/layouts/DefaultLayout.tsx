import { Box, Grid, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';
import powered from 'src/assets/powered.svg';
import { AuthFooter } from 'src/components/Footer/AuthFooter';

export default function DefaultLayout() {
  return (
    <Box>
      <Box
        sx={{
          px: { xs: 12, sm: 12, md: 16, xl: 50 }, // Increased values here
          py: { xs: 12, sm: 16, xl: 37 },
        }}
      >
        <Grid container>
          <Grid item xs={12} sm={12} md={6}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Typography
                color="primary"
                sx={{ fontWeight: 800, fontSize: '100px', lineHeight: '62px' }}
              >
                <b>
                  <Box component="span" color="secondary.light">
                    Hu
                  </Box>
                  <Box component="span" color="primary.main">
                    Fi
                  </Box>
                </b>
              </Typography>
              <Typography
                color="primary"
                variant="h5"
                fontSize={24}
                fontWeight={400}
                lineHeight={'36px'}
                my={3}
              >
                Launch campaigns, provide <br /> liquidity and earn rewards.
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'left', mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'left', mt: 2 }}>
                  <Box
                    component="img"
                    src={powered}
                    alt="Human"
                    sx={{ width: '250px', height: '120px' }}
                  />
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={12} md={6}>
            <Outlet />
          </Grid>
        </Grid>
        <AuthFooter />
      </Box>
    </Box>
  );
}
