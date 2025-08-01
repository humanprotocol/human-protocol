import type { SelectProps } from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import SelectMui from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { Controller } from 'react-hook-form';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { Chip } from '@/shared/components/ui/chip';
import { useColorMode } from '@/shared/contexts/color-mode';

export interface OptionsProps {
  id: number;
  name: string;
  value: string;
}

interface SelectComponentProps extends Omit<SelectProps, 'name' | 'error'> {
  options: OptionsProps[];
  name: string;
  label?: string;
  ariaLabelledby?: string;
  isChipRenderValue?: boolean;
}

export function Select({
  ariaLabelledby,
  name,
  label,
  options,
  isChipRenderValue,
  ...props
}: SelectComponentProps) {
  const { colorPalette } = useColorMode();
  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => (
        <FormControl error={Boolean(fieldState.error)} fullWidth>
          {label ? <InputLabel id={`${name}-label`}>{label}</InputLabel> : null}
          <SelectMui
            {...field}
            aria-labelledby={ariaLabelledby}
            error={Boolean(fieldState.error)}
            labelId={`${name}-label`}
            sx={{ '& .MuiSvgIcon-root': { color: colorPalette.primary.main } }}
            {...props}
            label={label}
            renderValue={
              isChipRenderValue
                ? (selected) => <Chip label={selected as string} />
                : undefined
            }
          >
            {options.map((elem) => (
              <MenuItem key={elem.value} value={elem.value}>
                {elem.name}
              </MenuItem>
            ))}
          </SelectMui>
          <FormHelperText>{fieldState.error?.message}</FormHelperText>
        </FormControl>
      )}
    />
  );
}
