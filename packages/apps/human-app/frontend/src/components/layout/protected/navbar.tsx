import { Grid, IconButton, Stack } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { t } from 'i18next';
import { HumanLogoIcon } from '@/components/ui/icons';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Button } from '@/components/ui/button';
import { useIsHCaptchaLabelingPage } from '@/hooks/use-is-hcaptcha-labeling-page';
import { useColorMode } from '@/hooks/use-color-mode';

export const NAVBAR_PADDING = '16px';

interface NavbarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleUserStatsDrawer?: () => void;
  userStatsDrawerOpen: boolean;
}

export function Navbar({
  setOpen,
  open,
  userStatsDrawerOpen,
  toggleUserStatsDrawer,
}: NavbarProps) {
  const { colorPalette } = useColorMode();
  const isMobile = useIsMobile();
  const isHCaptchaLabelingPage = useIsHCaptchaLabelingPage();

  let iconButton = null;
  if (open) {
    iconButton = (
      <IconButton
        onClick={() => {
          setOpen(false);
        }}
      >
        <CloseIcon />
      </IconButton>
    );
  } else if (userStatsDrawerOpen) {
    iconButton = (
      <IconButton
        onClick={() => {
          if (toggleUserStatsDrawer) {
            toggleUserStatsDrawer();
          }
        }}
      >
        <CloseIcon />
      </IconButton>
    );
  } else {
    iconButton = (
      <IconButton
        onClick={() => {
          setOpen(true);
        }}
      >
        <MenuIcon />
      </IconButton>
    );
  }

  return (
    <Stack
      alignItems="center"
      component="header"
      direction="row"
      justifyContent="space-between"
      sx={{
        backgroundColor: colorPalette.white,
        display: { xs: 'flex', md: 'none' },
        width: '100%',
        px: isMobile ? NAVBAR_PADDING : 0,
        py: isMobile ? '32px' : 0,
        zIndex: '130',
        position: open ? 'sticky' : 'relative',
        top: open ? '0' : 'unset',
      }}
    >
      <HumanLogoIcon />
      <Grid
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        {isHCaptchaLabelingPage && toggleUserStatsDrawer ? (
          <Button
            disabled={open}
            onClick={toggleUserStatsDrawer}
            sx={{ padding: '6px' }}
            variant={userStatsDrawerOpen ? 'contained' : 'outlined'}
          >
            {t('translation:worker.hcaptchaLabelingStats.statistics')}
          </Button>
        ) : null}
        {iconButton}
      </Grid>
    </Stack>
  );
}
