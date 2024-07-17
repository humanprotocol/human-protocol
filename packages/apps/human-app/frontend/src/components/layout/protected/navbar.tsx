import { Grid, IconButton, Stack } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { t } from 'i18next';
import { HumanLogoIcon } from '@/components/ui/icons';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';
import { useIsHCaptchaLabelingPage } from '@/hooks/use-is-hcaptcha-labeling-page';

export const paddingX = '44px';

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
  const isMobile = useIsMobile();
  const isHCaptchaLabelingPage = useIsHCaptchaLabelingPage();
  const getIcon = () => {
    switch (true) {
      case open:
        return (
          <CloseIcon
            onClick={() => {
              setOpen(false);
            }}
          />
        );
      case !open && !userStatsDrawerOpen:
        return (
          <MenuIcon
            onClick={() => {
              setOpen(true);
            }}
          />
        );
      case userStatsDrawerOpen:
        return (
          <CloseIcon
            onClick={() => {
              if (toggleUserStatsDrawer) {
                toggleUserStatsDrawer();
              }
            }}
          />
        );
      default:
        return null;
    }
  };

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
        px: isMobile ? paddingX : 0,
        py: isMobile ? '32px' : 0,
        zIndex: '1300',
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
        <IconButton>{getIcon()}</IconButton>
      </Grid>
    </Stack>
  );
}
