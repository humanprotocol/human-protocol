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
import { Box, Chip, OutlinedInput } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';

interface MultiSelectProps extends Omit<SelectProps, 'name'> {
  options: string[];
  name: string;
  label: string;
}

type FieldType = ControllerRenderProps<FieldValues, string>;

const CHECK_ALL_NAME = 'CHECK_ALL';

export function MultiSelect({
  name,
  options,
  label,
  ...props
}: MultiSelectProps) {
  const { t } = useTranslation();
  const context = useFormContext();

  const isFieldChecked = (field: FieldType, option: string) => {
    if (Array.isArray(field.value)) {
      return field.value.includes(option);
    }
    return false;
  };

  const isAllFieldsChecked = (field: FieldType) => {
    if (Array.isArray(field.value)) {
      return field.value.length === options.length;
    }
    return false;
  };

  const onDelete = (value: string) => {
    const values = context.getValues();
    const selectValues = values[name] as string[];
    const index = selectValues.indexOf(value);
    if (index === -1) {
      return;
    }

    context.unregister(`${name}.${index}`);
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
          label={value}
          onDelete={() => {
            onDelete(value);
          }}
        />
      ))}
    </Box>
  );

  const handleChange = (
    event: SelectChangeEvent<string[]>,
    field: FieldType
  ) => {
    const value = event.target.value;
    if (
      value[value.length - 1] === CHECK_ALL_NAME &&
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
      render={({ field }) => {
        return (
          <FormControl fullWidth>
            <InputLabel id={`${name}-${label}`}>{label}</InputLabel>
            <Select
              input={<OutlinedInput id={name} label={label} />}
              {...field}
              defaultValue={[]}
              id={name}
              labelId={`${name}-${label}`}
              multiple
              renderValue={renderValue}
              {...props}
              onChange={(event) => {
                handleChange(event, field);
              }}
            >
              <MenuItem value={CHECK_ALL_NAME}>
                <Checkbox checked={isAllFieldsChecked(field)} />
                <ListItemText>
                  {t('components.multiSelect.allFields')}
                </ListItemText>
              </MenuItem>
              {options.map((option) => (
                <MenuItem key={option} value={option}>
                  <Checkbox checked={isFieldChecked(field, option)} />
                  <ListItemText>{option}</ListItemText>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      }}
    />
  );
}
