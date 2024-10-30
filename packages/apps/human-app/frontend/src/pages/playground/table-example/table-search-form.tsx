import Search from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import { FormProvider, useForm } from 'react-hook-form';
import { Input } from '@/components/data-entry/input';
import { useColorMode } from '@/hooks/use-color-mode';

interface SearchFormProps {
  label: string;
  name: string;
  placeholder: string;
  columnId: string;
  fullWidth?: boolean;
  updater?: (fieldValue: string) => void;
}

export function SearchForm({
  label,
  name,
  placeholder,
  updater,
  fullWidth = false,
}: SearchFormProps) {
  const { colorPalette } = useColorMode();
  const methods = useForm<{ searchValue: string }>({
    defaultValues: {
      searchValue: '',
    },
  });

  return (
    <FormProvider {...methods}>
      <Input
        InputProps={{
          sx: { color: colorPalette.text.secondary },
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ fill: colorPalette.text.primary }} />
            </InputAdornment>
          ),
        }}
        label={label}
        name={name}
        onChange={(e) => {
          if (updater) {
            updater(e.target.value);
          }
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
