import { Grid, IconButton, Stack } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { t } from 'i18next';
import { HumanLogoNavbarIcon } from '@/shared/components/ui/icons';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Button } from '@/shared/components/ui/button';
import { useIsHCaptchaLabelingPage } from '@/shared/hooks/use-is-hcaptcha-labeling-page';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useHandleMainNavIconClick } from '@/shared/hooks/use-handle-main-nav-icon-click';

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
  const handleMainNavIconClick = useHandleMainNavIconClick();
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
      component="header"
      direction="row"
      sx={{
        display: { xs: 'flex', md: 'none' },
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colorPalette.backgroundColor,
        width: '100%',
        px: 2,
        py: 3,
        zIndex: '130',
        position: open ? 'sticky' : 'relative',
        top: open ? '0' : 'unset',
      }}
    >
      <Button
        variant="text"
        aria-label={t('components.navbar.home')}
        disableRipple
        sx={{
          background: 'none',
          p: 0,
        }}
        onClick={() => {
          if (isMobile) {
            setOpen(false);
          }
          handleMainNavIconClick();
        }}
      >
        <HumanLogoNavbarIcon />
      </Button>
      <Grid
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
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
