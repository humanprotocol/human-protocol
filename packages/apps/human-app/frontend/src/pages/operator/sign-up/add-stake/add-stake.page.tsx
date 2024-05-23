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
import {
  stakedAmountFormatter,
  useGetStakedAmount,
} from '@/api/servieces/operator/get-stacked-amount';
import { useAddStakeMutationState } from '@/api/servieces/operator/add-stake';
import { useHMTokenDecimals } from '@/api/servieces/operator/human-token-decimals';
import { jsonRpcErrorHandler } from '@/shared/helpers/json-rpc-error-handler';

export function AddStakeOperatorPage() {
  const [displayForm, setDisplayForm] = useState(false);
  const {
    data: stakedAmount,
    isError: isGetStakedAmountError,
    error: getStackedAmountError,
    isPending: isGetStakedAmountPending,
  } = useGetStakedAmount();
  const addStakeMutationState = useAddStakeMutationState();
  const {
    data: decimalsData,
    error: decimalsDataError,
    isPending: isDecimalsDataPending,
  } = useHMTokenDecimals();

  const getAlert = () => {
    switch (true) {
      case Boolean(addStakeMutationState?.error):
        return (
          <Alert color="error" severity="error">
            {defaultErrorMessage(
              addStakeMutationState?.error,
              jsonRpcErrorHandler
            )}
          </Alert>
        );
      case addStakeMutationState?.status === 'success':
        return (
          <Alert color="success" severity="success">
            {t('operator.stakeForm.successAlert', {
              amount: addStakeMutationState.variables?.amount
                ? addStakeMutationState.variables.amount
                : -1,
            })}
          </Alert>
        );

      default:
        return undefined;
    }
  };

  if (isGetStakedAmountError || decimalsDataError) {
    return (
      <PageCardError
        errorMessage={defaultErrorMessage(
          getStackedAmountError,
          jsonRpcErrorHandler
        )}
      />
    );
  }

  if (
    isGetStakedAmountPending ||
    isDecimalsDataPending ||
    decimalsData === undefined
  ) {
    return <PageCardLoader />;
  }

  return (
    <PageCard
      alert={getAlert()}
      backArrowPath={-1}
      title={t('operator.addStake.title')}
    >
      <Grid
        container
        sx={{ flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}
      >
        <Typography variant="body4">
          {t('operator.addStake.formHeader')}
        </Typography>
        <Typography variant="subtitle2">
          {t('operator.addStake.label')}
        </Typography>
        <Typography color={colorPalette.primary.light} variant="body5">
          {stakedAmountFormatter(stakedAmount)}
        </Typography>
        {displayForm ? (
          <StakeForm
            closeForm={setDisplayForm.bind(null, false)}
            decimals={decimalsData}
            stakedAmount={stakedAmount}
          />
        ) : (
          <Buttons openForm={setDisplayForm.bind(null, true)} />
        )}
      </Grid>
    </PageCard>
  );
}
