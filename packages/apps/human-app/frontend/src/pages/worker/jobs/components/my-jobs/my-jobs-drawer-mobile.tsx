import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import { Checkbox, Divider, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';
import { SortArrow } from '@/components/ui/icons';
import { useMobileDrawerFilterStore } from '@/hooks/use-mobile-drawer-filter-store';

interface DrawerNavigationProps {
  open: boolean;
  drawerWidth: number;
}

export function MyJobsDrawerMobile({
  open,
  drawerWidth,
}: DrawerNavigationProps) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { myJobsUniqueValues, myJobsFilters, setMyJobsFilters } =
    useMobileDrawerFilterStore();

  const isValueInArray = (value: string, array: string[]) =>
    array.filter((item) => item === value).length > 0;

  const updateFilters = (value: string, parameter: string) => {
    const { [parameter]: currentParameterFilters, ...otherFilters } =
      myJobsFilters as unknown as Record<string, string[]>;

    if (isValueInArray(value, currentParameterFilters)) {
      setMyJobsFilters({
        ...otherFilters,
        [parameter]: currentParameterFilters.filter((item) => item !== value),
      });
    } else {
      setMyJobsFilters({
        ...otherFilters,
        [parameter]: [...currentParameterFilters, value],
      });
    }
  };

  return (
    <Box sx={{ display: 'flex', position: 'relative' }}>
      <CssBaseline />
      <Drawer
        anchor="left"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : drawerWidth,
            boxSizing: 'border-box',
            paddingTop: '132px',
            px: '50px',
          },
        }}
        variant="persistent"
      >
        <Typography variant="mobileHeaderLarge">
          {t('worker.jobs.mobileFilterDrawer.filters')}
        </Typography>
        <Divider
          sx={{
            my: '16px',
          }}
        />
        <Typography variant="mobileHeaderMid">
          {t('worker.jobs.mobileFilterDrawer.sortBy')}
        </Typography>
        <Typography color={colorPalette.text.secondary} variant="body2">
          {t('worker.jobs.jobDescription')}
        </Typography>
        <Button
          onClick={() => {
            setMyJobsFilters({
              ...myJobsFilters,
              sortingOrder: {
                sortingColumn: 'jobDescription',
                sortingOrder: 'ASC',
              },
            });
          }}
          size="small"
          sx={{
            marginLeft: '16px',
            maxWidth: 'fit-content',
          }}
          variant="text"
        >
          <SortArrow />{' '}
          <Typography
            sx={{
              marginLeft: '10px',
            }}
            variant="subtitle1"
          >
            A/Z
          </Typography>
        </Button>
        <Button
          onClick={() => {
            setMyJobsFilters({
              ...myJobsFilters,
              sortingOrder: {
                sortingColumn: 'jobDescription',
                sortingOrder: 'DESC',
              },
            });
          }}
          size="small"
          sx={{
            marginLeft: '16px',
            maxWidth: 'fit-content',
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
            sx={{
              marginLeft: '10px',
            }}
            variant="subtitle1"
          >
            Z/A
          </Typography>
        </Button>
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
              setMyJobsFilters({
                ...myJobsFilters,
                sortingOrder: {
                  sortingColumn: 'rewardAmount',
                  sortingOrder: 'DESC',
                },
              });
            }}
            sx={{
              marginLeft: '10px',
            }}
            variant="subtitle1"
          >
            From highest
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
              setMyJobsFilters({
                ...myJobsFilters,
                sortingOrder: {
                  sortingColumn: 'rewardAmount',
                  sortingOrder: 'ASC',
                },
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
          }}
        />
        <Typography variant="mobileHeaderMid">
          {t('worker.jobs.network')}
        </Typography>
        {myJobsUniqueValues.network.map((v) => (
          <Stack
            alignItems="center"
            flexDirection="row"
            key={crypto.randomUUID()}
          >
            <Checkbox
              checked={isValueInArray(v, myJobsFilters.network)}
              onClick={() => {
                updateFilters(v, 'network');
              }}
            />
            <Typography>{v}</Typography>
          </Stack>
        ))}
        <Divider
          sx={{
            my: '16px',
          }}
        />
        <Typography variant="mobileHeaderMid">
          {t('worker.jobs.jobType')}
        </Typography>
        {myJobsUniqueValues.jobType.map((v) => (
          <Stack
            alignItems="center"
            flexDirection="row"
            key={crypto.randomUUID()}
          >
            <Checkbox
              checked={isValueInArray(v, myJobsFilters.jobType)}
              onClick={() => {
                updateFilters(v, 'jobType');
              }}
            />
            <Typography>{v}</Typography>
          </Stack>
        ))}
        {myJobsUniqueValues.jobType.map((v) => (
          <Stack
            alignItems="center"
            flexDirection="row"
            key={crypto.randomUUID()}
          >
            <Checkbox
              checked={isValueInArray(v, myJobsFilters.jobType)}
              onClick={() => {
                updateFilters(v, 'jobType');
              }}
            />
            <Typography>{v}</Typography>
          </Stack>
        ))}
      </Drawer>
    </Box>
  );
}
