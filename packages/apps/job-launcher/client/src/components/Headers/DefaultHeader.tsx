import { AppBar, Box, Link, Toolbar } from '@mui/material';
import React from 'react';
import logoImg from '../../assets/logo.svg';

export function DefaultHeader() {
  return (
    <AppBar component="nav" sx={{ background: '#fff', boxShadow: 'none' }}>
      <Toolbar>
        <img src={logoImg} alt="HUMAN App" style={{ width: 192 }} />
        <Box sx={{ display: { xs: 'none', sm: 'block' }, ml: 'auto' }}>
          <Link
            sx={{ fontSize: '14px', fontWeight: 600 }}
            href="https://dashboard.humanprotocol.org"
          >
            Dashboard
          </Link>
          <Link
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              ml: 3,
            }}
            href="https://humanprotocol.org"
          >
            HUMAN Website
          </Link>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
