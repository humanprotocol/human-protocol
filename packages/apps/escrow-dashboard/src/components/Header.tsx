import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Toolbar from '@mui/material/Toolbar';

import TokenPriceIndicator from './TokenPriceIndicator';

const Header: React.FC = (): React.ReactElement => (
  <Box sx={{ flexGrow: 1 }}>
    <AppBar position="fixed" sx={{ background: '#fff', boxShadow: 'none' }}>
      <Toolbar disableGutters>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            padding: {
              xs: '30px 8px 26px',
              sm: '30px 28px 26px',
              md: '30px 52px 26px',
            },
          }}
        >
          <Box display="flex" alignItems="center">
            <img src="/images/logo.svg" alt="logo" />
            <Typography variant="h6" color="primary" ml="10px">
              Scan
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" ml="auto">
            <TokenPriceIndicator />
            <Link
              href="https://humanprotocol.org"
              target="_blank"
              sx={{
                textDecoration: 'none',
                ml: '28px',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                HUMAN Website
              </Typography>
            </Link>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  </Box>
);

export default Header;
