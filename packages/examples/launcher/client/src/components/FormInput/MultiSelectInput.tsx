import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import { useFormContext, Controller } from 'react-hook-form';
import { TextFieldProps } from '@mui/material';
import { CssTextField } from './style';
import { TooltipWhite } from '../Tooltip';

type IAutocompleteFormInput = {
  name: string;
  variant?: string;
  tooltipTitle?: string;
} & TextFieldProps;

interface IProduct {
  id: string;
  label: string;
}

export const AutocompleteFormInput: React.FC<IAutocompleteFormInput> = ({
  name,
  tooltipTitle = '',
  variant = 'filled',
  ...otherProps
}) => {
  const [options, setOptions] = React.useState([
    { id: '1', label: 'car' },
    { id: '2', label: 'not car' },
  ]);

  const [input, setInput] = React.useState('');
  const handleKeyPress = (ev: any) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      const inputOptions = [
        ...options,
        { id: String(Math.random()), label: input },
      ];
      setOptions([...inputOptions]);
    }
  };

  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { ref, onChange, value, ...rest } }) => {
        return (
          <Autocomplete
            multiple
            options={options.map((option: IProduct) => option.label)}
            onChange={(_, values) => onChange(values)}
            renderInput={(params) => {
              return (
                <TooltipWhite title={tooltipTitle} placement="top-start">
                  <CssTextField
                    {...params}
                    {...otherProps}
                    {...rest}
                    inputRef={ref}
                    fullWidth
                    sx={{ mb: '1.5rem', backgroundColor: '#fff' }}
                    error={!!errors[name]}
                    helperText={
                      <>{errors[name] ? errors[name]?.message : ''}</>
                    }
                    variant={variant}
                    onChange={(e: any) => {
                      setInput(e.target.value);
                      onChange();
                    }}
                    onKeyPress={handleKeyPress}
                  />
                </TooltipWhite>
              );
            }}
          />
        );
      }}
    />
  );
};
