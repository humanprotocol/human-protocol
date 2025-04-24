import Search from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo } from 'react';
import Grid from '@mui/material/Grid';
import debounce from 'lodash/debounce';
import { useColorMode } from '@/shared/contexts/color-mode';
import { Input } from '@/shared/components/data-entry/input';
import { addressSchemaOrEmptyString } from '@/shared/schemas';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

interface SearchFormProps {
  label: string;
  placeholder: string;
  columnId: string;
  fullWidth?: boolean;
  updater: (fieldValue: string) => void;
}

export function EscrowAddressSearchForm({
  label,
  placeholder,
  updater,
  fullWidth = false,
}: Readonly<SearchFormProps>) {
  const isMobile = useIsMobile();
  const { colorPalette } = useColorMode();
  const methods = useForm({
    defaultValues: {
      searchValue: '',
    },
    resolver: zodResolver(
      z.object({ searchValue: addressSchemaOrEmptyString })
    ),
  });

  const debouncedUpdater = useMemo(
    () =>
      debounce(async (value: string) => {
        const isValid = await methods.trigger('searchValue');
        if (isValid) {
          updater(value);
        }
      }, 500),
    [updater, methods]
  );

  useEffect(() => {
    return () => {
      debouncedUpdater.cancel();
    };
  }, [debouncedUpdater]);

  useEffect(() => {
    const subscription = methods.watch((value, { name }) => {
      if (name === 'searchValue') {
        void debouncedUpdater(value.searchValue ?? '');
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [debouncedUpdater, methods]);

  return (
    <Grid
      sx={{
        color: colorPalette.text.secondary,
        width: isMobile ? 'unset' : '362px',
      }}
    >
      <FormProvider {...methods}>
        <Input
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fill: colorPalette.text.primary }} />
              </InputAdornment>
            ),
          }}
          fullWidth
          label={label}
          name="searchValue"
          onChange={(e) => {
            methods.setValue('searchValue', e.target.value);
          }}
          placeholder={placeholder}
          sx={{
            width: fullWidth ? '100%' : '362px',
            margin: fullWidth ? '0' : '1rem',
          }}
          onBlur={() => {
            void methods.trigger('searchValue');
          }}
        />
      </FormProvider>
    </Grid>
  );
}
