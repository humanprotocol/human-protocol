import { FC } from 'react';

import { Switch, FormControlLabel, useTheme } from '@mui/material';

import { LightModeIcon, DarkModeIcon } from '../../icons';

const ThemeModeSwitch: FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <FormControlLabel
      control={
        <>
          <LightModeIcon sx={{ color: 'text.primary' }} />
          <Switch
            checked={isDarkMode}
            onChange={theme.toggleColorMode}
            color="primary"
            disableRipple
            sx={{
              '& .MuiSwitch-thumb': {
                bgcolor: 'text.primary',
              },
              '& .MuiSwitch-switchBase': {
                '&:hover': {
                  bgcolor: 'transparent',
                },
              },
              '& .MuiSwitch-track': {
                bgcolor: isDarkMode
                  ? 'rgba(205, 199, 255, 0.9) !important'
                  : 'rgba(20, 6, 178, 0.3) !important',
                borderRadius: '10px',
              },
            }}
          />
          <DarkModeIcon sx={{ color: 'text.primary' }} />
        </>
      }
      label=""
      sx={{
        m: 0,
        '& .MuiFormControlLabel-label': {
          display: 'none',
        },
      }}
    />
  );
};

export default ThemeModeSwitch;
