import { AppBar, Box, Link as MuiLink, Toolbar } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.svg';

export function DefaultHeader() {
  return (
    <AppBar component="nav" sx={{ background: '#fff', boxShadow: 'none' }}>
      <Toolbar>
        <Link to="/">
          <img
            src={logoImg}
            alt="Fortune Exchange Oracle"
            style={{ width: 192 }}
          />
        </Link>
        <Box sx={{ display: { xs: 'none', sm: 'block' }, ml: 'auto' }}>
          <MuiLink
            sx={{ fontSize: '14px', fontWeight: 600 }}
            href="https://dashboard.humanprotocol.org"
          >
            Dashboard
          </MuiLink>
          <MuiLink
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              ml: 3,
            }}
            href="https://humanprotocol.org"
          >
            HUMAN Website
          </MuiLink>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
