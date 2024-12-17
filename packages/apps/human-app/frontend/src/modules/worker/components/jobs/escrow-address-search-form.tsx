import Search from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import Grid from '@mui/material/Grid';
import debounce from 'lodash/debounce';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { Input } from '@/shared/components/data-entry/input';
import { addressSchemaOrEmptyString } from '@/shared/helpers/validate-address-schema';
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
}: SearchFormProps) {
  const isMobile = useIsMobile();
  const { colorPalette } = useColorMode();
  const methods = useForm<{ searchValue: string }>({
    defaultValues: {
      searchValue: '',
    },
    resolver: zodResolver(
      z.object({ searchValue: addressSchemaOrEmptyString })
    ),
  });

  const debouncedUpdater = debounce((value: string) => {
    updater(value);
  }, 500);

  useEffect(() => {
    const subscription = methods.watch(() => {
      void methods.trigger('searchValue').then((isSearchValueValid) => {
        const inputValue = methods.getValues('searchValue');
        if (isSearchValueValid) {
          debouncedUpdater(inputValue);
        }
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [debouncedUpdater, methods, updater]);

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
        />
      </FormProvider>
    </Grid>
  );
}
