/* eslint-disable camelcase --- response from api */
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import { Divider, IconButton, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { HumanLogoIcon, SortArrow } from '@/components/ui/icons';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { useColorMode } from '@/hooks/use-color-mode';
import { MyJobsNetworkFilterMobile } from './my-jobs-network-filter-mobile';
import { MyJobsJobTypeFilterMobile } from './my-jobs-job-type-filter-mobile';
import { MyJobsStatusFilterMobile } from './my-jobs-status-filter-mobile';

interface DrawerMobileProps {
  setIsMobileFilterDrawerOpen: Dispatch<SetStateAction<boolean>>;
}
export function MyJobsDrawerMobile({
  setIsMobileFilterDrawerOpen,
}: DrawerMobileProps) {
  const { colorPalette } = useColorMode();
  const { t } = useTranslation();
  const { setFilterParams, filterParams } = useMyJobsFilterStore();

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
          <HumanLogoIcon />

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
        <Typography color={colorPalette.text.secondary} variant="body2">
          {t('worker.jobs.rewardAmount')}
        </Typography>
        <Button
          size="small"
          sx={{
            marginLeft: '16px',
            maxWidth: 'fit-content',
          }}
          variant="text"
        >
          <SortArrow />
          <Typography
            onClick={() => {
              setFilterParams({
                ...filterParams,
                sort: 'DESC',
                sort_field: 'reward_amount',
              });
            }}
            sx={{
              marginLeft: '10px',
            }}
            variant="subtitle1"
          >
            {t('worker.jobs.sortDirection.fromHighest')}
          </Typography>
        </Button>
        <Button
          size="small"
          sx={{
            marginLeft: '16px',
            maxWidth: 'fit-content',
            marginBottom: '16px',
          }}
          variant="text"
        >
          <Box
            sx={{
              transform: 'rotate(180deg)',
            }}
          >
            <SortArrow />
          </Box>
          <Typography
            onClick={() => {
              setFilterParams({
                ...filterParams,
                sort: 'ASC',
                sort_field: 'reward_amount',
              });
            }}
            sx={{
              marginLeft: '10px',
            }}
            variant="subtitle1"
          >
            From lowest
          </Typography>
        </Button>
        <Typography color={colorPalette.text.secondary} variant="body2">
          {t('worker.jobs.expiresAt')}
        </Typography>
        <Button
          size="small"
          sx={{
            marginLeft: '16px',
            maxWidth: 'fit-content',
          }}
          variant="text"
        >
          <SortArrow />
          <Typography
            onClick={() => {
              setFilterParams({
                ...filterParams,
                sort: 'DESC',
                sort_field: 'expires_at',
              });
            }}
            sx={{
              marginLeft: '10px',
            }}
            variant="subtitle1"
          >
            {t('worker.jobs.sortDirection.fromHighest')}
          </Typography>
        </Button>
        <Button
          size="small"
          sx={{
            marginLeft: '16px',
            maxWidth: 'fit-content',
            marginBottom: '16px',
          }}
          variant="text"
        >
          <Box
            sx={{
              transform: 'rotate(180deg)',
            }}
          >
            <SortArrow />
          </Box>
          <Typography
            onClick={() => {
              setFilterParams({
                ...filterParams,
                sort: 'ASC',
                sort_field: 'expires_at',
              });
            }}
            sx={{
              marginLeft: '10px',
            }}
            variant="subtitle1"
          >
            From lowest
          </Typography>
        </Button>
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
          <MyJobsNetworkFilterMobile />
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
