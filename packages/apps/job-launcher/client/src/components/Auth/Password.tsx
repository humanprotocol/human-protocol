import { Box, TextField, TextFieldProps } from '@mui/material';
import React, { useState } from 'react';

export const Password = (props: TextFieldProps) => {
  const [hidden, setHidden] = useState(true);
  const ToogleShow = (e: any) => {
    e.preventDefault();
    setHidden(!hidden);
  };
  const { placeholder, name, value, onChange, onBlur, error, helperText } =
    props;
  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        fullWidth
        placeholder={placeholder}
        type={hidden ? 'password' : 'text'}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
        helperText={helperText}
      />
      <span
        onClick={ToogleShow}
        className="position-absolute d-flex flex-column justify-content-center h-100"
      >
        <i
          className={`fa ${hidden ? 'fa-eye-slash' : 'fa-eye'}`}
          aria-hidden="true"
        />
      </span>
    </Box>
  );
};
