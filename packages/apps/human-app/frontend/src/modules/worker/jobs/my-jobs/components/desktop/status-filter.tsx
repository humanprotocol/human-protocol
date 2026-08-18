import { useTranslation } from 'react-i18next';
import { Stack } from '@mui/material';

import { Button } from '@/shared/components/ui/button';
import { MyJobStatus, type StatusFilterType } from '../../../types';
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
        border: (theme) => `1px solid ${theme.palette.border.main}`,
        bgcolor: 'background.subtle',
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
              color: isActive ? 'accent.contrastText' : 'text.auxiliary200',
              bgcolor: isActive ? 'accent.main' : 'transparent',
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
