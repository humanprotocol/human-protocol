import { Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { ProfileData } from './profile-data';
import { Button } from '@/shared/components/ui/button';
import { HelpIcon } from '@/shared/components/ui/icons';
import { MOBILE_BOTTOM_TRAY_HEIGHT } from '@/shared/consts';

export function ProfileBottomTray() {
  const { t } = useTranslation();

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        height: MOBILE_BOTTOM_TRAY_HEIGHT,
        px: 2,
        py: 3,
        position: 'fixed',
        left: '0',
        right: '0',
        bottom: { xs: 0, md: 'auto' },
        width: '100%',
        bgcolor: 'background.paper',
        borderRadius: '20px 20px 0 0',
        borderTop: '1px solid',
        borderColor: 'border.main',
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <ProfileData />
      <Button
        variant="text"
        startIcon={<HelpIcon />}
        disableRipple
        sx={{ height: { xs: 20, md: 32 }, p: 0, bgcolor: 'transparent' }}
        onClick={() => {
          if (window.$zoho?.salesiq?.chat?.start) {
            window.$zoho.salesiq.chat.start();
          }
        }}
      >
        {t('components.DrawerNavigation.help')}
      </Button>
    </Stack>
  );
}
