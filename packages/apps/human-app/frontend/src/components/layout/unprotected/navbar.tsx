import { useState } from 'react';
import type { Theme } from '@mui/material';
import {
  Box,
  Link,
  Typography,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import MenuIcon from '@mui/icons-material/Menu';
import { HumanLogoIcon, HumanLogoNavbarIcon } from '@/components/ui/icons';

interface NavbarProps {
  withNavigation: boolean;
}

export function Navbar({ withNavigation }: NavbarProps) {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const theme: Theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.up('md'));
  return (
    <Box
      position="static"
      sx={{
        background: 'transparent',
        height: '90px',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {isMobile ? <HumanLogoNavbarIcon /> : <HumanLogoIcon />}
      {withNavigation ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
            }}
          >
            <Link href="#" sx={{ mr: 1.5 }} underline="none">
              <Typography fontSize={15} fontWeight={600}>
                {t('components.navbar.humanProtocol')}
              </Typography>
            </Link>
            <Link href="#" sx={{ mr: 1.5 }} underline="none">
              <Typography fontSize={15} fontWeight={600}>
                {t('components.navbar.howItWorks')}
              </Typography>
            </Link>
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              onClick={() => {
                setIsDrawerOpen(!isDrawerOpen);
              }}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              onClose={() => {
                setIsDrawerOpen(false);
              }}
              open={isDrawerOpen}
            >
              <Box
                sx={{
                  width: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  p: 2,
                }}
              >
                <Link href="#" sx={{ my: 1 }} underline="none">
                  {t('components.navbar.humanProtocol')}
                </Link>
                <Link href="#" sx={{ my: 1 }} underline="none">
                  {t('components.navbar.howItWorks')}
                </Link>
              </Box>
            </Drawer>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
