import { FC } from 'react';

import { IconButton, useTheme } from '@mui/material';

import { DarkModeIcon } from '@/components/Icons/DarkModeIcon';
import { LightModeIcon } from '@/components/Icons/LightModeIcon';

const ThemeModeSwitch: FC = () => {
  const { isDarkMode, toggleColorMode } = useTheme();

  return (
    <IconButton onClick={toggleColorMode}>
      {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
};

export default ThemeModeSwitch;
