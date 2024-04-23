import Search from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import { FormProvider, useForm } from 'react-hook-form';
import type { MRT_RowData, MRT_TableInstance } from 'material-react-table';
import type { Dispatch, SetStateAction } from 'react';
import { Input } from '@/components/data-entry/input';
import { colorPalette } from '@/styles/color-palette';

interface SearchFormProps<T extends MRT_RowData> {
  updater:
    | MRT_TableInstance<T>['setColumnFilters']
    | Dispatch<SetStateAction<{ id: string; value: string }[]>>;
  label: string;
  name: string;
  placeholder: string;
  columnId: string;
  fullWidth?: boolean;
}

export function SearchForm<T extends MRT_RowData>({
  updater,
  label,
  name,
  placeholder,
  columnId,
  fullWidth = false,
}: SearchFormProps<T>) {
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
              <Search />
            </InputAdornment>
          ),
        }}
        label={label}
        name={name}
        onChange={(e) => {
          updater([{ id: columnId, value: e.target.value }]);
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
