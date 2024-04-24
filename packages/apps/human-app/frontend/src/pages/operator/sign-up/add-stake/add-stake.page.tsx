import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';
import { useState } from 'react';
import { t } from 'i18next';
import {
  PageCard,
  PageCardError,
  PageCardLoader,
} from '@/components/ui/page-card';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { colorPalette } from '@/styles/color-palette';
import { Buttons } from '@/pages/operator/sign-up/add-stake/buttons';
import { StakeForm } from '@/pages/operator/sign-up/add-stake/stake-form';
import { Alert } from '@/components/ui/alert';
import { useGetStakedAmount } from '@/api/servieces/operator/get-stacked-amount';
import { useAddStakeMutationState } from '@/api/servieces/operator/add-stake';

export function AddStakeOperatorPage() {
  const [displayForm, setDisplayForm] = useState(false);
  const getStakedAmountQuery = useGetStakedAmount();
  const addStakeMutationState = useAddStakeMutationState();

  const errorAlert = addStakeMutationState?.error ? (
    <Alert color="error" severity="error">
      {defaultErrorMessage(addStakeMutationState.error)}
    </Alert>
  ) : undefined;

  const successAlert =
    addStakeMutationState?.status === 'success' ? (
      <Alert color="success" severity="success">
        {t('operator.stakeForm.successAlert', {
          amount: addStakeMutationState.variables?.amount
            ? addStakeMutationState.variables.amount
            : -1,
        })}
      </Alert>
    ) : undefined;

  if (getStakedAmountQuery.isError) {
    return (
      <PageCardError
        errorMessage={defaultErrorMessage(getStakedAmountQuery.error)}
      />
    );
  }

  if (getStakedAmountQuery.isPending) {
    return <PageCardLoader />;
  }

  return (
    <PageCard
      alert={errorAlert || successAlert}
      backArrowPath={-1}
      title={t('operator.addStake.title')}
    >
      <Grid
        container
        sx={{ flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}
      >
        <Typography variant="h5">
          {t('operator.addStake.formHeader')}
        </Typography>
        <Typography variant="subtitle2">
          {t('operator.addStake.label')}
        </Typography>
        <Typography color={colorPalette.primary.light} variant="subtitle2">
          {getStakedAmountQuery.data}
        </Typography>
        {displayForm ? (
          <StakeForm />
        ) : (
          <Buttons openForm={setDisplayForm.bind(null, true)} />
        )}
      </Grid>
    </PageCard>
  );
}
