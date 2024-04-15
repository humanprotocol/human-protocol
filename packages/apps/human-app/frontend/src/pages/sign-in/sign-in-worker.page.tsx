import { useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { FormProvider, useForm } from 'react-hook-form';
import { Grid } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormCard } from '@/components/ui/form-card';
import { Input } from '@/components/data-entry/input';
import { Button } from '@/components/ui/button';
import { Password } from '@/components/data-entry/password';

export interface Inputs {
  email: string;
  password: string;
}

const schema = z.object({
  email: z.string().min(2),
  password: z.string().min(6),
});

type Schema = z.infer<typeof schema>;

export function SignInWorker() {
  // eslint-disable-next-line react/hook-use-state -- temporary solution
  const [_, setValues] = useState<Schema>();

  const methods = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    const formData = {
      ...data,
    };
    setValues(formData);
  };

  return (
    <FormCard title="Sign In">
      <FormProvider {...methods}>
        <form onSubmit={(event) => void methods.handleSubmit(onSubmit)(event)}>
          <Grid container gap="4rem">
            <Grid container gap="2rem">
              <Input fullWidth label="Email" name="email" />
              <Password fullWidth label="Password" name="password" />
            </Grid>
            <Button fullWidth type="submit" variant="contained">
              Sign In
            </Button>
          </Grid>
        </form>
      </FormProvider>
    </FormCard>
  );
}
