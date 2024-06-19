import { Grid, IconButton, Stack } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { t } from 'i18next';
import { HumanLogoIcon } from '@/components/ui/icons';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';
import { useIsHCaptchaLabelingPage } from '@/hooks/use-is-hcaptcha-labeling-page';

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
        px: isMobile ? '44px' : 0,
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
            onClick={toggleUserStatsDrawer}
            sx={{ padding: '3px' }}
            variant={userStatsDrawerOpen ? 'contained' : 'outlined'}
          >
            {t('translation:worker.hcaptchaLabelingStats.statistics')}
          </Button>
        ) : null}
        <IconButton
          onClick={() => {
            setOpen(!open);
          }}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
      </Grid>
    </Stack>
  );
}
