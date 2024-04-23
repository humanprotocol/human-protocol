import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { t } from 'i18next';
import {
  PageCard,
  PageCardError,
  PageCardLoader,
} from '@/components/ui/page-card';
import { useGetStakedAmountMutation } from '@/api/servieces/operator/get-stacked-amount';
import { useWalletConnect } from '@/hooks/use-wallet-connect';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { colorPalette } from '@/styles/color-palette';
import { Buttons } from '@/pages/operator/sign-up/add-stake/buttons';
import { StakeForm } from '@/pages/operator/sign-up/add-stake/stake-form';
import { useAddStakeMutation } from '@/api/servieces/operator/add-stake';
import { Alert } from '@/components/ui/alert';

export function AddStakeOperatorPage() {
  const { address } = useWalletConnect();
  const [displayForm, setDisplayForm] = useState(false);
  const [stackedAmount, setStackedAmount] = useState<number>();

  const {
    mutate: getStackedAmountOperatorMutate,
    error: getStackedAmountOperatorError,
    isError: isGetStackedAmountOperatorError,
    data: stackedAmountData,
    isPending: isGetStackedAmountOperatorPending,
  } = useGetStakedAmountMutation();

  const useAddStakeMutationResult = useAddStakeMutation({
    onSuccess: (_, { address: successAddress, amount }) => {
      setDisplayForm(false);
      setStackedAmount(amount);
      getStackedAmountOperatorMutate({ address: successAddress });
    },
  });

  const {
    isSuccess: isAddStackOperatorSuccess,
    isError: isAddStackOperatorError,
    error: addStackOperatorError,
    reset: addStackOperatorReset,
  } = useAddStakeMutationResult;

  const errorAlert = isAddStackOperatorError ? (
    <Alert color="error" severity="error">
      {defaultErrorMessage(addStackOperatorError)}
    </Alert>
  ) : undefined;

  const successAlert = isAddStackOperatorSuccess ? (
    <Alert color="success" severity="success">
      {t('operator.stakeForm.successAlert', { amount: stackedAmount })}
    </Alert>
  ) : undefined;

  const handleAddressChange = (_address: string) => {
    getStackedAmountOperatorMutate({ address: _address });
    setStackedAmount(undefined);
    addStackOperatorReset();
  };

  useEffect(() => {
    if (address) {
      handleAddressChange(address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- no nesseccary
  }, [address]);

  if (isGetStackedAmountOperatorError) {
    return (
      <PageCardError
        errorMessage={defaultErrorMessage(getStackedAmountOperatorError)}
      />
    );
  }

  if (isGetStackedAmountOperatorPending) {
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
          {stackedAmountData}
        </Typography>
        {displayForm ? (
          <StakeForm useAddStakeMutationResult={useAddStakeMutationResult} />
        ) : (
          <Buttons openForm={setDisplayForm.bind(null, true)} />
        )}
      </Grid>
    </PageCard>
  );
}
