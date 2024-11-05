import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import { Divider, IconButton, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import type { Dispatch, SetStateAction } from 'react';
import { HumanLogoIcon } from '@/components/ui/icons';
import { AvailableJobsNetworkFilterMobile } from '@/pages/worker/jobs/components/available-jobs/mobile/available-jobs-network-filter-mobile';
import { AvailableJobsStatusFilterMobile } from '@/pages/worker/jobs/components/available-jobs/mobile/available-jobs-status-filter-mobile';
import { useHandleMainNavIconClick } from '@/hooks/use-handle-main-nav-icon-click';
import { AvailableJobsJobTypeFilterMobile } from '@/pages/worker/jobs/components/available-jobs/mobile/available-jobs-job-type-filter-mobile';
import { AvailableJobsRewardAmountSortMobile } from '@/pages/worker/jobs/components/available-jobs/mobile/available-jobs-reward-amount-sort-mobile';
import { useColorMode } from '@/hooks/use-color-mode';

interface DrawerMobileProps {
  setIsMobileFilterDrawerOpen: Dispatch<SetStateAction<boolean>>;
}
export function AvailableJobsDrawerMobile({
  setIsMobileFilterDrawerOpen,
}: DrawerMobileProps) {
  const handleMainNavIconClick = useHandleMainNavIconClick();
  const { colorPalette } = useColorMode();
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', position: 'relative' }}>
      <CssBaseline />
      <Drawer
        open
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            paddingTop: '132px',
            px: '50px',
            width: '100vw',
            zIndex: '9999999',
            background: colorPalette.white,
          },
        }}
        variant="persistent"
      >
        <Stack
          alignItems="center"
          component="header"
          direction="row"
          justifyContent="space-between"
          sx={{
            position: 'absolute',
            left: '0',
            top: '0',
            background: colorPalette.white,
            display: 'flex',
            width: '100%',
            px: '44px',
            pt: '32px',
            zIndex: '999999',
          }}
        >
          <Stack
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              handleMainNavIconClick();
            }}
          >
            <HumanLogoIcon />
          </Stack>

          <IconButton
            onClick={() => {
              setIsMobileFilterDrawerOpen(false);
            }}
            sx={{
              zIndex: '99999999',
              marginRight: '15px',
              backgroundColor: colorPalette.white,
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
        <Typography variant="mobileHeaderLarge">
          {t('worker.jobs.mobileFilterDrawer.filters')}
        </Typography>
        <Divider
          sx={{
            my: '16px',
            background: colorPalette.text.secondary,
          }}
        />
        <Typography variant="mobileHeaderMid">
          {t('worker.jobs.mobileFilterDrawer.sortBy')}
        </Typography>
        <AvailableJobsRewardAmountSortMobile />
        <Typography variant="mobileHeaderLarge">
          {t('worker.jobs.mobileFilterDrawer.filters')}
        </Typography>
        <Divider
          sx={{
            my: '16px',
            background: colorPalette.text.secondary,
          }}
        />
        <Typography variant="mobileHeaderMid">
          {t('worker.jobs.network')}
        </Typography>
        <Stack
          alignItems="center"
          flexDirection="row"
          key={crypto.randomUUID()}
        >
          <AvailableJobsNetworkFilterMobile />
        </Stack>

        <Divider
          sx={{
            my: '16px',
            background: colorPalette.text.secondary,
          }}
        />
        <Typography variant="mobileHeaderMid">
          {t('worker.jobs.jobType')}
        </Typography>
        <Stack
          alignItems="center"
          flexDirection="row"
          key={crypto.randomUUID()}
        >
          <AvailableJobsJobTypeFilterMobile />
        </Stack>
        <Divider
          sx={{
            my: '16px',
            background: colorPalette.text.secondary,
          }}
        />
        <Typography variant="mobileHeaderMid">
          {t('worker.jobs.status')}
        </Typography>
        <AvailableJobsStatusFilterMobile />
      </Drawer>
    </Box>
  );
}
