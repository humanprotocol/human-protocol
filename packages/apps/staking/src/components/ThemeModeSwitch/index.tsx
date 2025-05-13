import { FC } from 'react';

import { IconButton, useTheme } from '@mui/material';

import { LightModeIcon, DarkModeIcon } from '../../icons';

const ThemeModeSwitch: FC = () => {
  const { isDarkMode, toggleColorMode } = useTheme();

  return (
    <IconButton onClick={toggleColorMode}>
      {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
};

export default ThemeModeSwitch;
