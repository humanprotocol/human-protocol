import { t } from 'i18next';
import { FormProvider, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Grid } from '@mui/material';
import { useJobsTypesOraclesFilter } from '@/hooks/use-job-types-oracles-table';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { MultiSelect } from '@/components/data-entry/multi-select';
import { JOB_TYPES } from '@/shared/consts';

export function OraclesTableJobTypesSelect() {
  const isMobile = useIsMobile();
  const { selectJobType } = useJobsTypesOraclesFilter();
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
            label="Job types"
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
