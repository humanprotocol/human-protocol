import { t } from 'i18next';
import { FormProvider, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Grid } from '@mui/material';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { MultiSelect } from '@/shared/components/data-entry/multi-select';
import { JOB_TYPES } from '@/shared/consts';
import { useJobsTypesOraclesFilterStore } from '../../jobs/hooks';

export function OraclesTableJobTypesSelect() {
  const isMobile = useIsMobile();
  const { selectJobType } = useJobsTypesOraclesFilterStore();
  const methods = useForm<{ jobType: string[] }>({
    defaultValues: {
      jobType: [],
    },
  });

  const selectedJobType = methods.watch('jobType');

  useEffect(() => {
    selectJobType(selectedJobType);
  }, [selectJobType, selectedJobType]);

  return (
    <Grid sx={{ maxWidth: isMobile ? '100%' : '256px', padding: '2rem 0' }}>
      <FormProvider {...methods}>
        <form>
          <MultiSelect
            label="Task Types"
            name="jobType"
            options={JOB_TYPES.map((jobType) => ({
              label: t(`jobTypeLabels.${jobType}`),
              value: jobType,
            }))}
          />
        </form>
      </FormProvider>
    </Grid>
  );
}
