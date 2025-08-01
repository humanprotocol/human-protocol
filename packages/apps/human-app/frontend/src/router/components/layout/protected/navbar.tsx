import { Grid, IconButton, Stack } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { t } from 'i18next';
import { HumanLogoIcon } from '@/shared/components/ui/icons';
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
}: Readonly<NavbarProps>) {
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
      alignItems="center"
      component="header"
      direction="row"
      justifyContent="space-between"
      sx={{
        backgroundColor: colorPalette.backgroundColor,
        display: { xs: 'flex', md: 'none' },
        width: '100%',
        px: isMobile ? 4 : 0,
        py: isMobile ? 3 : 0,
        zIndex: '130',
        position: open ? 'sticky' : 'relative',
        top: open ? '0' : 'unset',
      }}
    >
      <Grid
        sx={{ cursor: 'pointer', paddingLeft: '8px' }}
        onClick={() => {
          if (isMobile) {
            setOpen(false);
          }
          handleMainNavIconClick();
        }}
        role="button"
        tabIndex={0}
        aria-hidden="true"
      >
        <HumanLogoIcon />
      </Grid>
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
