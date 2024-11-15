import { AppBar, Box, Toolbar, Typography } from '@mui/material';
import { FC } from 'react';
import { Link } from 'react-router-dom';
import logoSvg from '../../assets/logo.svg';

export const Header: FC = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="fixed"
        sx={{
          background: 'rgba(255, 255, 255, 0.8)',
          boxShadow: 'none',
          backdropFilter: 'blur(9px)',
        }}
      >
        <Toolbar disableGutters>
          <Box sx={{ width: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                height: '88px',
                boxSizing: 'border-box',
                padding: {
                  xs: '29px 24px',
                  md: '29px 77px 20px 60px',
                },
              }}
            >
              <>
                <Link
                  to="/"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                  }}
                >
                  <Box
                    component="img"
                    src={logoSvg}
                    alt="logo"
                    sx={{ width: { xs: '100px', md: '118px' } }}
                  />
                  <Typography
                    sx={{
                      fontSize: { xs: '14px', md: '16px' },
                      lineHeight: { xs: 1, md: 1.5 },
                      letterSpacing: '0.15px',
                    }}
                    color="primary"
                    ml="10px"
                  >
                    Faucet
                  </Typography>
                </Link>
              </>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
};
