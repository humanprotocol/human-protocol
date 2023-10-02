import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';
import { CheckFilledIcon } from '../../../components/Icons/CheckFilledIcon';

const ProgressText = styled(Typography)({
  display: 'flex',
  alignItems: 'center',
  width: '300px',
  position: 'relative',
  paddingLeft: '30px',
});

const CheckedIcon = styled(CheckFilledIcon)({
  position: 'absolute',
  left: '0px',
});

export const LaunchJobProgress = () => {
  return (
    <Box
      sx={{
        background: '#fff',
        borderRadius: '16px',
        boxShadow:
          '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
        py: '180px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <ProgressText>
        <CheckedIcon /> Creating Job
      </ProgressText>
      <ProgressText>
        <CheckedIcon /> Setting Up Job
      </ProgressText>
      <ProgressText>Paying Job</ProgressText>
    </Box>
  );
};
