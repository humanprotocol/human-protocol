import * as React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { TextFieldProps } from '@mui/material';
import { CssTextField } from './style';
import { TooltipWhite } from '../Tooltip';

type FormInputProps = {
  name: string;
  tooltipTitle?: string;
  variant?: string;
  type?: string;
} & TextFieldProps;

const FormInput: React.FC<FormInputProps> = ({
  name,
  tooltipTitle = '',
  variant = 'filled',
  type,
  ...otherProps
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      defaultValue=""
      render={({ field }) => (
        <TooltipWhite title={tooltipTitle} placement="top-start">
          <CssTextField
            {...field}
            {...otherProps}
            type={type}
            fullWidth
            InputProps={{ style: { fontSize: 14 } }}
            variant={variant}
            sx={{ mb: '1.5rem', backgroundColor: '#fff' }}
            error={!!errors[name]}
            helperText={<>{errors[name] ? errors[name]?.message : ''}</>}
          />
        </TooltipWhite>
      )}
    />
  );
};

export default FormInput;
