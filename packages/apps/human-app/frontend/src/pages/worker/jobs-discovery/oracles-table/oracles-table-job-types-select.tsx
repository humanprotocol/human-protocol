import { FormProvider, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Grid } from '@mui/material';
import { useJobsTypesOraclesFilter } from '@/hooks/use-job-types-oracles-table';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { MultiSelect } from '@/components/data-entry/multi-select';

export function OraclesTableJobTypesSelect({
  jobTypes,
}: {
  jobTypes: string[];
}) {
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
          <MultiSelect label="Job types" name="jobType" options={jobTypes} />
        </form>
      </FormProvider>
    </Grid>
  );
}
