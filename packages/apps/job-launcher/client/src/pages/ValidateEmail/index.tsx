import { Box } from '@mui/material';
import React from 'react';
import ValidateEmailForm from '../../components/Auth/ValidateEmailForm';

export default function ValidateEmail() {
  return (
    <Box
      sx={{
        mx: 'auto',
        maxWidth: '560px',
        minHeight: '580px',
        background: '#fff',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        borderRadius: '16px',
        border: '1px solid #dbe1f6',
        boxShadow:
          '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
      }}
    >
      <ValidateEmailForm />
    </Box>
  );
}
