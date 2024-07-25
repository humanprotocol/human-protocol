import { zodResolver } from '@hookform/resolvers/zod';
import Grid from '@mui/material/Grid';
import { FormProvider, useForm } from 'react-hook-form';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { z } from 'zod';
import {
  addStakeAmountCallArgumentsSchema,
  useAddStakeMutation,
  type AddStakeCallArguments,
} from '@/api/servieces/operator/add-stake';
import { breakpoints } from '@/styles/theme';
import { Input } from '@/components/data-entry/input';
import { routerPaths } from '@/router/router-paths';
import { Button } from '@/components/ui/button';

export function StakeForm({
  decimals,
  stakedAmount,
}: {
  decimals: number;
  stakedAmount?: bigint;
}) {
  const addStakeMutation = useAddStakeMutation();

  const methods = useForm<AddStakeCallArguments>({
    defaultValues: {
      // Since we deal with numbers that may have huge decimal extensions,
      // we are using strings as a safer solution
      amount: '0',
    },
    resolver: zodResolver(
      z.object({ amount: addStakeAmountCallArgumentsSchema(decimals) })
    ),
  });

  const addStake = (data: AddStakeCallArguments) => {
    addStakeMutation.mutate(data);
  };

  const isStaked = stakedAmount ? stakedAmount > BigInt(0) : false;
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
              mask="HumanCurrencyInputMask"
              name="amount"
              type="text"
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
                fullWidth
                loading={addStakeMutation.isPending}
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
                {isStaked
                  ? t('operator.stakeForm.nextBtn')
                  : t('operator.stakeForm.skipBtn')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </FormProvider>
    </Grid>
  );
}
