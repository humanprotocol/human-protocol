import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import type { ControllerRenderProps, FieldValues } from 'react-hook-form';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import type { SelectProps, SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Chip,
  Divider,
  FormHelperText,
  OutlinedInput,
  Typography,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import { useColorMode } from '@/hooks/use-color-mode';

interface MultiSelectProps extends Omit<SelectProps, 'name'> {
  options: { label: string; value: string }[];
  name: string;
  label: string;
}

type FieldType = ControllerRenderProps<FieldValues, string>;

const CLEAR_ALL_VALUE = 'CLEAR_ALL_VALUE';
const CHECK_ALL_VALUE = 'CHECK_ALL_VALUE';

export function MultiSelect({
  name,
  options,
  label,
  ...props
}: MultiSelectProps) {
  const { colorPalette } = useColorMode();
  const { t } = useTranslation();
  const context = useFormContext();
  const valuesToLabels = useMemo(() => {
    const mapping: Record<string, string> = {};
    for (const option of options) {
      mapping[option.value] = option.label;
    }
    return mapping;
  }, [options]);

  const isFieldChecked = (field: FieldType, option: string) => {
    if (Array.isArray(field.value)) {
      return field.value.includes(option);
    }
    return false;
  };

  const onDelete = (value: string) => {
    const currentValues = context.getValues()[name] as string[];

    context.setValue(
      name,
      currentValues.filter((val) => {
        return val !== value;
      })
    );
  };

  const renderValue = (selected: string[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {selected.map((value) => (
        <Chip
          clickable
          deleteIcon={
            <CancelIcon
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            />
          }
          key={value}
          label={valuesToLabels[value]}
          onDelete={() => {
            onDelete(value);
          }}
          sx={{ backgroundColor: colorPalette.chip.main }}
        />
      ))}
    </Box>
  );

  const handleChange = (
    event: SelectChangeEvent<string[]>,
    field: FieldType
  ) => {
    const value = event.target.value;

    if (value.includes(CLEAR_ALL_VALUE)) {
      context.setValue(name, []);
      return;
    }

    if (
      value[value.length - 1] === CHECK_ALL_VALUE &&
      Array.isArray(field.value)
    ) {
      context.setValue(
        name,
        field.value.length === options.length ? [] : options
      );
    } else {
      context.setValue(name, value);
    }
  };

  return (
    <Controller
      defaultValue={[]}
      name={name}
      render={({ field, fieldState }) => {
        return (
          <FormControl fullWidth>
            <InputLabel id={`${name}-${label}`}>{label}</InputLabel>
            <Select
              input={<OutlinedInput id={name} label={label} />}
              {...field}
              defaultValue={[]}
              error={Boolean(fieldState.error)}
              id={name}
              labelId={`${name}-${label}`}
              multiple
              renderValue={renderValue}
              sx={{
                '& .MuiSvgIcon-root': { color: colorPalette.primary.main },
              }}
              {...props}
              onChange={(event) => {
                handleChange(event, field);
              }}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Checkbox checked={isFieldChecked(field, option.value)} />
                  <ListItemText>{option.label}</ListItemText>
                </MenuItem>
              ))}
              <Divider component="li" variant="fullWidth" />
              <MenuItem sx={{ paddingLeft: '1.8rem' }} value={CLEAR_ALL_VALUE}>
                <Typography variant="buttonMedium">
                  {t('components.multiSelect.clearAll')}
                </Typography>
              </MenuItem>
            </Select>
            <FormHelperText sx={{ color: colorPalette.error.main }}>
              {fieldState.error?.message}
            </FormHelperText>
          </FormControl>
        );
      }}
    />
  );
}
