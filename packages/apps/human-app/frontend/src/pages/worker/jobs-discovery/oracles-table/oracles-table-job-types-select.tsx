import { FormProvider, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Grid } from '@mui/material';
import { t } from 'i18next';
import type { OptionsProps } from '@/components/data-entry/select';
import { Select } from '@/components/data-entry/select';
import { useJobsTypesOraclesFilter } from '@/hooks/use-job-types-oracles-table';
import { useIsMobile } from '@/hooks/use-is-mobile';

const defaultJobType = {
  name: t('worker.oraclesTable.allJobs'),
  id: -1,
  value: '',
};

export function OraclesTableJobTypesSelect({
  jobTypes,
}: {
  jobTypes: OptionsProps[];
}) {
  const isMobile = useIsMobile();
  const { selectJobType } = useJobsTypesOraclesFilter();
  const methods = useForm<{ jobType: OptionsProps }>({
    defaultValues: {
      jobType: defaultJobType,
    },
  });

  const selectedJobType = methods.watch('jobType');

  useEffect(() => {
    if (selectedJobType.id === defaultJobType.id) {
      selectJobType(undefined);
    }
    selectJobType(selectedJobType.value);
  }, [selectJobType, selectedJobType]);

  return (
    <Grid sx={{ maxWidth: isMobile ? '100%' : '256px', padding: '2rem 0' }}>
      <FormProvider {...methods}>
        <form>
          <Select
            defaultValue={defaultJobType}
            label="Job types"
            name="jobType"
            options={[defaultJobType, ...jobTypes]}
          />
        </form>
      </FormProvider>
    </Grid>
  );
}
