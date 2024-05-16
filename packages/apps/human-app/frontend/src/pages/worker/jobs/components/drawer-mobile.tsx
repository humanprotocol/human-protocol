/* eslint-disable camelcase --- response from api */
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Checkbox,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import type { Dispatch, SetStateAction } from 'react';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';
import { HumanLogoIcon, SortArrow } from '@/components/ui/icons';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';

interface DrawerMobileProps {
  selectedTab: string;
  setIsMobileFilterDrawerOpen: Dispatch<SetStateAction<boolean>>;
}
export function DrawerMobile({
  selectedTab,
  setIsMobileFilterDrawerOpen,
}: DrawerMobileProps) {
  const { t } = useTranslation();
  const { setFilterParams, filterParams } = useJobsFilterStore();

  const handleCheckboxClick = (paramName: string, paramValue: string) => {
    if (filterParams[paramName] === paramValue) {
      setFilterParams({
        ...filterParams,
        [paramName]: undefined,
      });
    } else {
      setFilterParams({
        ...filterParams,
        [paramName]: paramValue,
      });
    }
  };

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
          <SortArrow />{' '}
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
          </Box>{' '}
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
          <Checkbox
            checked={filterParams.network === 'MATIC'}
            onClick={() => {
              handleCheckboxClick('network', 'MATIC');
            }}
          />
          <Typography>
            {t('worker.jobs.mobileFilterDrawer.network.matic')}
          </Typography>
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
          <Checkbox
            checked={filterParams.job_type === 'FORTUNE'}
            onClick={() => {
              handleCheckboxClick('job_type', 'FORTUNE');
            }}
          />
          <Typography>
            {t('worker.jobs.mobileFilterDrawer.jobType.fortune')}
          </Typography>
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
        <>
          <Stack
            alignItems="center"
            flexDirection="row"
            key={crypto.randomUUID()}
          >
            <Checkbox
              checked={filterParams.status === 'ACTIVE'}
              onClick={() => {
                handleCheckboxClick('status', 'ACTIVE');
              }}
            />
            <Typography>
              {t('worker.jobs.mobileFilterDrawer.jobsStatus.active')}
            </Typography>
          </Stack>
          <Stack
            alignItems="center"
            flexDirection="row"
            key={crypto.randomUUID()}
          >
            <Checkbox
              checked={filterParams.status === 'COMPLETED'}
              onClick={() => {
                handleCheckboxClick('status', 'COMPLETED');
              }}
            />
            <Typography>
              {t('worker.jobs.mobileFilterDrawer.jobsStatus.completed')}
            </Typography>
          </Stack>
          <Stack
            alignItems="center"
            flexDirection="row"
            key={crypto.randomUUID()}
          >
            <Checkbox
              checked={filterParams.status === 'CANCELED'}
              onClick={() => {
                handleCheckboxClick('status', 'CANCELED');
              }}
            />
            <Typography>
              {t('worker.jobs.mobileFilterDrawer.jobsStatus.canceled')}
            </Typography>
          </Stack>
          {selectedTab === 'myJobs' && (
            <>
              <Stack
                alignItems="center"
                flexDirection="row"
                key={crypto.randomUUID()}
              >
                <Checkbox
                  checked={filterParams.status === 'VALIDATION'}
                  onClick={() => {
                    handleCheckboxClick('status', 'VALIDATION');
                  }}
                />
                <Typography>
                  {t('worker.jobs.mobileFilterDrawer.jobsStatus.validation')}
                </Typography>
              </Stack>
              <Stack
                alignItems="center"
                flexDirection="row"
                key={crypto.randomUUID()}
              >
                <Checkbox
                  checked={filterParams.status === 'EXPIRED'}
                  onClick={() => {
                    handleCheckboxClick('status', 'EXPIRED');
                  }}
                />
                <Typography>
                  {t('worker.jobs.mobileFilterDrawer.jobsStatus.expired')}
                </Typography>
              </Stack>
              <Stack
                alignItems="center"
                flexDirection="row"
                key={crypto.randomUUID()}
              >
                <Checkbox
                  checked={filterParams.status === 'REJECTED'}
                  onClick={() => {
                    handleCheckboxClick('status', 'REJECTED');
                  }}
                />
                <Typography>
                  {t('worker.jobs.mobileFilterDrawer.jobsStatus.rejected')}
                </Typography>
              </Stack>
            </>
          )}
        </>
      </Drawer>
    </Box>
  );
}
