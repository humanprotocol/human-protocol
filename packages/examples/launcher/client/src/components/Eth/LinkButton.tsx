import * as React from 'react';
import { Box, Button } from '@mui/material';

export const LinkButton = ({ title }: any) => {
  return (
    <Box sx={{ m: '0 auto' }}>
      <Button
        type="submit"
        variant="contained"
        sx={{
          backgroundColor: '#fff',
          fontSize: '24px',
          width: '200px',
          height: '120px',
          color: '#6309ff',
          '&:hover': {
            backgroundColor: '#fff',
            color: '#6309ff',
            boxShadow: '4px 4px rgb(0 0 0 / 15%)',
          },
        }}
      >
        {title}
      </Button>
    </Box>
  );
};
