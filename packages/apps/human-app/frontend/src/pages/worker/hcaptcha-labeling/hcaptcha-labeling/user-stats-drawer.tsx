import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import { Grid, Typography } from '@mui/material';
import { UserStatsDetails } from '@/pages/worker/hcaptcha-labeling/hcaptcha-labeling/user-stats-details';

export interface UserStatsDrawerNavigationProps {
  isOpen: boolean;
}

export function UserStatsDrawer({ isOpen }: UserStatsDrawerNavigationProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <CssBaseline />
      <Drawer
        anchor="left"
        open={isOpen}
        sx={{
          width: '100%',
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: '100%',
            boxSizing: 'border-box',
            paddingTop: '44px',
          },
        }}
        variant="persistent"
      >
        <Grid
          container
          sx={{
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            flexDirection: 'column',
            gap: '2rem',
            marginTop: '50px',
          }}
        >
          <Typography variant="mobileHeaderLarge">
            hCapcha Statistics
          </Typography>
          <UserStatsDetails />
        </Grid>
      </Drawer>
    </Box>
  );
}
