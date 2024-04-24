import { zodResolver } from '@hookform/resolvers/zod';
import Grid from '@mui/material/Grid';
import { FormProvider, useForm } from 'react-hook-form';
import type { UseMutationResult } from '@tanstack/react-query';
import Button from '@mui/material/Button';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import type { AddStakeCallArguments } from '@/api/servieces/operator/add-stake';
import { addStakeCallArgumentsSchema } from '@/api/servieces/operator/add-stake';
import { useWalletConnect } from '@/hooks/use-wallet-connect';
import type { ResponseError } from '@/shared/types/global.type';
import { breakpoints } from '@/styles/theme';
import { Input } from '@/components/data-entry/input';
import { routerPaths } from '@/router/router-paths';
import { HumanCurrencyInputMask } from '@/components/data-entry/input-masks';

interface StakeFormProps {
  useAddStakeMutationResult: UseMutationResult<
    void,
    ResponseError,
    AddStakeCallArguments
  >;
}

export function StakeForm({
  useAddStakeMutationResult: {
    mutate: addStakeOperatorMutation,
    isPending: isAddStakeOperatorPending,
  },
}: StakeFormProps) {
  const { address } = useWalletConnect();

  const methods = useForm<AddStakeCallArguments>({
    defaultValues: {
      amount: 0,
      address: address || '',
    },
    resolver: zodResolver(addStakeCallArgumentsSchema),
  });

  const addStake = (data: AddStakeCallArguments) => {
    addStakeOperatorMutation(data);
  };

  return (
    <Grid container sx={{ flexDirection: 'column', gap: '1rem' }}>
      <Typography variant="body1">
        {t('operator.stakeForm.description')}
      </Typography>
      <FormProvider {...methods}>
        <form
          onSubmit={(event) => {
            void methods.handleSubmit(addStake)(event);
          }}
        >
          <Grid container gap="2rem">
            <Input
              fullWidth
              label={t('operator.stakeForm.label')}
              mask={HumanCurrencyInputMask}
              name="amount"
            />
            <Grid
              container
              gap="1rem"
              sx={{
                flex: '1',
                flexWrap: 'nowrap',
                [breakpoints.mobile]: {
                  flexWrap: 'wrap',
                },
              }}
            >
              <Button
                disabled={isAddStakeOperatorPending}
                fullWidth
                type="submit"
                variant="contained"
              >
                {t('operator.stakeForm.formBtn')}
              </Button>
              <Button
                component={Link}
                fullWidth
                to={routerPaths.operator.addKeys}
                variant="outlined"
              >
                {t('operator.stakeForm.backBtn')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </FormProvider>
    </Grid>
  );
}
