import { zodResolver } from '@hookform/resolvers/zod';
import Grid from '@mui/material/Grid';
import { FormProvider, useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import {
  addStakeCallArgumentsSchema,
  useAddStakeMutation,
  type AddStakeCallArguments,
} from '@/api/servieces/operator/add-stake';
import { breakpoints } from '@/styles/theme';
import { Input } from '@/components/data-entry/input';

export function StakeForm() {
  const addStakeMutation = useAddStakeMutation();

  const methods = useForm<AddStakeCallArguments>({
    defaultValues: {
      amount: 0,
    },
    resolver: zodResolver(addStakeCallArgumentsSchema),
  });

  const addStake = (data: AddStakeCallArguments) => {
    addStakeMutation.mutate(data);
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
              mask="HumanCurrencyInputMask"
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
                disabled={addStakeMutation.isPending}
                fullWidth
                type="submit"
                variant="contained"
              >
                {t('operator.stakeForm.formBtn')}
              </Button>
              <Button
                component={Link}
                fullWidth
                to="/next-page"
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
