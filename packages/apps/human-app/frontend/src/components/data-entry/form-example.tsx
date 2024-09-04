import { useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm, FormProvider } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { Input } from '@/components/data-entry/input';
import { Select } from '@/components/data-entry/select';
import { RadioButton } from '@/components/data-entry/radio-button';
import { Checkbox } from '@/components/data-entry/checkbox';
import { Slider } from '@/components/data-entry/slider';
import { MultiSelect } from '@/components/data-entry/multi-select';
import { Password } from '@/components/data-entry/password/password';

export interface Inputs {
  name: string;
  surname: string;
  email: string;
  firstCheckbox: boolean;
  slider: number;
  month: string;
}

const names = [
  'Oliver Hansen',
  'Van Henry',
  'April Tucker',
  'Ralph Hubbard',
  'Omar Alexander',
  'Carlos Abbott',
  'Miriam Wagner',
  'Bradley Wilkerson',
  'Virginia Andrews',
  'Kelly Snyder',
];

const accounts = [
  {
    id: 1,
    name: 'PL76114011245044546199764000',
    value: 'PL76114011245044546199764000',
  },
  {
    id: 2,
    name: 'PL76114011245044546199761111',
    value: 'PL76114011245044546199761111',
  },
  {
    id: 2,
    name: 'PL76114011245044546199764117',
    value: 'PL76114011245044546199764117',
  },
];

const MIN = 3000;
const MAX = 50000;

function CustomMarks({ min, max }: { min: number; max: number }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="body2">min. {min} PLN</Typography>
      <Typography variant="body2">max. {max} PLN</Typography>
    </Box>
  );
}

export function FormExample() {
  const [values, setValues] = useState<Inputs>();
  const methods = useForm<Inputs>({
    defaultValues: {
      name: '',
      surname: '',
      email: '',
    },
  });

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    const formData = {
      ...data,
    };
    setValues(formData);
  };

  return (
    <>
      <FormProvider {...methods}>
        <form onSubmit={(event) => void methods.handleSubmit(onSubmit)(event)}>
          <h4>Inputs</h4>

          <Grid container spacing={8} sx={{ marginBottom: '30px' }}>
            <Grid item xs={6}>
              <Input label="Name" name="name" />
            </Grid>
            <Grid item xs={6}>
              <Input label="Surname" name="surname" />
            </Grid>

            <Grid item xs={6}>
              <Input label="Phone number" name="phone" />
            </Grid>

            <Grid item xs={6}>
              <Input label="Email" name="email" />
            </Grid>
            <Grid item xs={6}>
              <Input
                label="Percents"
                mask="PercentsInputMask"
                name="percents"
              />
            </Grid>
            <Grid item xs={6}>
              <Input
                label="Human currency"
                mask="HumanCurrencyInputMask"
                name="percents"
              />
            </Grid>
            <Grid item xs={6}>
              <Password label="Password" name="password" />
            </Grid>

            <Grid item xs={6}>
              <Select
                label="Bank account"
                name="bankAccount"
                options={accounts}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={6}>
              <MultiSelect label="ID Merchanta" name="names" options={names} />
            </Grid>
          </Grid>

          <h3>Radio button</h3>

          <Grid container>
            <Grid item xs={6}>
              <RadioButton
                name="month"
                options={[
                  { label: '12 months', value: '12 months' },
                  { label: '6 months', value: '6 months' },
                ]}
              />
            </Grid>
          </Grid>

          <h3>Checkbox</h3>

          <Grid container>
            <Grid item xs={6}>
              <Checkbox label="Checkbox" name="firstCheckbox" />
            </Grid>
          </Grid>

          <h3>Slider</h3>
          <Grid container sx={{ marginBottom: '30px' }}>
            <Grid item xs={6}>
              <Slider
                customMarks={<CustomMarks max={MAX} min={MIN} />}
                max={MAX}
                min={MIN}
                name="slider"
              />
            </Grid>
          </Grid>

          <Grid container>
            <Grid item xs={12}>
              <input type="submit" />
            </Grid>
          </Grid>
        </form>
      </FormProvider>
      {values ? (
        <Stack direction="column">
          <Box>Name: {values.name}</Box>
          <Box>Surname: {values.surname}</Box>
          <Box>Email: {values.email}</Box>
          <Box>Slider: {values.slider}</Box>
          <Box>Month: {values.month}</Box>
        </Stack>
      ) : null}
    </>
  );
}
