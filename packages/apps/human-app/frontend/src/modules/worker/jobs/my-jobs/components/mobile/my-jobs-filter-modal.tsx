import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import { Divider, IconButton, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import { HumanLogoIcon } from '@/shared/components/ui/icons';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useHandleMainNavIconClick } from '@/shared/hooks/use-handle-main-nav-icon-click';
import { MyJobsNetworkFilterMobile } from './my-jobs-network-filter-mobile';
import { MyJobsJobTypeFilterMobile } from './my-jobs-job-type-filter-mobile';
import { MyJobsStatusFilterMobile } from './my-jobs-status-filter-mobile';
import { MyJobsExpiresAtSortMobile } from './my-jobs-expires-at-sort-mobile';
import { MyJobsRewardAmountSortMobile } from './my-jobs-reward-amount-sort-mobile';

interface MyJobsFilterModalProps {
  chainIdsEnabled: number[];
  close: () => void;
}
export function MyJobsFilterModal({
  chainIdsEnabled,
  close,
}: Readonly<MyJobsFilterModalProps>) {
  const handleMainNavIconClick = useHandleMainNavIconClick();
  const { colorPalette } = useColorMode();
  const { t } = useTranslation();

  return (
    <Box>
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
            background: colorPalette.backgroundColor,
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
            background: colorPalette.backgroundColor,
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
            onClick={close}
            sx={{
              zIndex: '99999999',
              marginRight: '15px',
              backgroundColor: colorPalette.backgroundColor,
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
        <MyJobsRewardAmountSortMobile />
        <MyJobsExpiresAtSortMobile />
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
        <Stack alignItems="center" flexDirection="row">
          <MyJobsNetworkFilterMobile chainIdsEnabled={chainIdsEnabled} />
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
        <Stack alignItems="center" flexDirection="row">
          <MyJobsJobTypeFilterMobile />
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
        <MyJobsStatusFilterMobile />
      </Drawer>
    </Box>
  );
}
