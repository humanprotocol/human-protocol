import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import { Divider, IconButton, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import { HumanLogoIcon } from '@/shared/components/ui/icons';
import { useHandleMainNavIconClick } from '@/shared/hooks/use-handle-main-nav-icon-click';
import { useColorMode } from '@/shared/contexts/color-mode';
import {
  AvailableJobsNetworkFilter,
  AvailableJobsJobTypeFilter,
} from './components';
import { AvailableJobsRewardAmountSortMobile } from './components/mobile/available-jobs-reward-amount-sort-mobile';

interface AvailableJobsFilterModalProps {
  chainIdsEnabled: number[];
  close: () => void;
}
export function AvailableJobsFilterModal({
  chainIdsEnabled,
  close,
}: Readonly<AvailableJobsFilterModalProps>) {
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
          <Stack sx={{ cursor: 'pointer' }} onClick={handleMainNavIconClick}>
            <HumanLogoIcon />
          </Stack>

          <IconButton
            onClick={close}
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
        <Stack alignItems="center" flexDirection="row">
          <AvailableJobsNetworkFilter chainIdsEnabled={chainIdsEnabled} />
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
          <AvailableJobsJobTypeFilter />
        </Stack>
      </Drawer>
    </Box>
  );
}
