import Search from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { useColorMode } from '@/hooks/use-color-mode';
import { Input } from '@/components/data-entry/input';
import { addressSchemaOrEmptyString } from '@/shared/helpers/validate-address-schema';

interface SearchFormProps {
  label: string;
  placeholder: string;
  columnId: string;
  fullWidth?: boolean;
  updater?: (fieldValue: string) => void;
}

export function EscrowAddressSearchForm({
  label,
  placeholder,
  updater,
  fullWidth = false,
}: SearchFormProps) {
  const { colorPalette } = useColorMode();
  const methods = useForm<{ searchValue: string }>({
    defaultValues: {
      searchValue: '',
    },
    resolver: zodResolver(
      z.object({ searchValue: addressSchemaOrEmptyString })
    ),
  });

  useEffect(() => {
    const subscription = methods.watch(() => {
      void methods.trigger('searchValue').then((isSearchValueValid) => {
        const inputValue = methods.getValues('searchValue');
        if (updater && isSearchValueValid) {
          updater(inputValue);
        }
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [methods, updater]);

  return (
    <FormProvider {...methods}>
      <Input
        hideErrorTextField
        InputProps={{
          sx: { color: colorPalette.text.secondary },
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ fill: colorPalette.text.primary }} />
            </InputAdornment>
          ),
        }}
        label={label}
        name="searchValue"
        onChange={(e) => {
          methods.setValue('searchValue', e.target.value);
        }}
        placeholder={placeholder}
        sx={{
          width: fullWidth ? '100%' : '15rem',
          margin: fullWidth ? '0' : '1rem',
        }}
      />
    </FormProvider>
  );
}
