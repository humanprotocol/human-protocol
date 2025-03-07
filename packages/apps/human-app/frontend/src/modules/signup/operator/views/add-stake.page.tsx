import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';
import { useState } from 'react';
import { t } from 'i18next';
import {
  PageCardError,
  PageCardLoader,
  PageCard,
} from '@/shared/components/ui/page-card';
import { getErrorMessageForError } from '@/shared/errors';
import { Alert } from '@/shared/components/ui/alert';
import { useColorMode } from '@/shared/contexts/color-mode';
import { onlyDarkModeColor } from '@/shared/styles/dark-color-palette';
import {
  useAddStakeMutationState,
  useGetStakedAmount,
  useHMTokenDecimals,
} from '../hooks';
import { StakeForm, Buttons } from '../components/add-stake';
import { stakedAmountFormatter } from '../utils';

export function AddStakeOperatorPage() {
  const { colorPalette, isDarkMode } = useColorMode();
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
    if (!addStakeMutationState) return undefined;

    switch (addStakeMutationState.status) {
      case 'error':
        return (
          <Alert color="error" severity="error">
            {getErrorMessageForError(addStakeMutationState.error)}
          </Alert>
        );
      case 'success':
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
        errorMessage={getErrorMessageForError(getStackedAmountError)}
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
    <PageCard alert={getAlert()} title={t('operator.addStake.title')}>
      <Grid
        container
        sx={{ flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}
      >
        <Typography variant="body4">
          {t('operator.addStake.formHeader')}
        </Typography>
        <Typography variant="subtitle2">
          {t('operator.addStake.label')}
        </Typography>
        <Typography
          color={
            isDarkMode
              ? onlyDarkModeColor.additionalTextColor
              : colorPalette.primary.light
          }
          variant="body5"
        >
          {stakedAmountFormatter(stakedAmount)}
        </Typography>
        {displayForm ? (
          <StakeForm decimals={decimalsData} stakedAmount={stakedAmount} />
        ) : (
          <Buttons
            openForm={setDisplayForm.bind(null, true)}
            stakedAmount={stakedAmount}
          />
        )}
      </Grid>
    </PageCard>
  );
}
