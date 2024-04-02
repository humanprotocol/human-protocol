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

  const renderValue = (selected: string[]) => {
    if (selected.length > 2) {
      const text: string = t('components.multiSelect.andMore', {
        number: selected.slice(2).length,
      });
      return `${selected.slice(0, 2).join(', ')} ... ${text} `;
    }
    return selected.map((elem) => elem).join(', ');
  };

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
          <FormControl fullWidth variant="standard">
            <InputLabel id={`${name}-label`}>{label}</InputLabel>
            <Select
              {...field}
              aria-labelledby={name}
              defaultValue={[]}
              id={name}
              labelId={`${name}-label`}
              multiple
              renderValue={renderValue}
              variant="standard"
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
