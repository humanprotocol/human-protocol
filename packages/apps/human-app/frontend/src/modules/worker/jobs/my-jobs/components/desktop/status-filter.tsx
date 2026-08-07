import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { Stack } from '@mui/material';
import { MyJobStatus, type StatusFilterType } from '../../../types';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useMyJobsFilterStore } from '../../../hooks';

export const STATUS_FILTER_OPTIONS = [
  {
    labelKey: 'worker.jobs.statusFilter.all',
    value: '',
  },
  {
    labelKey: 'worker.jobs.statusFilter.inProgress',
    value: MyJobStatus.ACTIVE,
  },
  {
    labelKey: 'worker.jobs.statusFilter.completed',
    value: MyJobStatus.COMPLETED,
  },
] as const satisfies {
  labelKey: string;
  value: StatusFilterType;
}[];

export function StatusFilter() {
  const { t } = useTranslation();
  const { colorPalette } = useColorMode();
  const { filterParams, setFilterParams } = useMyJobsFilterStore();
  const activeStatus = filterParams.status ?? '';

  return (
    <Stack
      direction="row"
      spacing={3}
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: '99px',
        border: `1px solid ${colorPalette.border.main}`,
        bgcolor: colorPalette.background.subtle,
      }}
    >
      {STATUS_FILTER_OPTIONS.map((option) => {
        const isActive = option.value === activeStatus;
        return (
          <Button
            key={option.value}
            variant="text"
            size="small"
            sx={{
              py: 0.5,
              px: isActive ? 1.5 : 1,
              color: isActive
                ? colorPalette.accent.contrastText
                : colorPalette.text.auxiliary200,
              bgcolor: isActive ? colorPalette.accent.main : 'transparent',
              borderRadius: '90px',
              minWidth: 'unset',
            }}
            onClick={() =>
              setFilterParams({
                status: option.value,
              })
            }
          >
            {t(option.labelKey)}
          </Button>
        );
      })}
    </Stack>
  );
}
