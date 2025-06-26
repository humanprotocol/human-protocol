import { FC } from 'react';

import { IconButton, useTheme } from '@mui/material';

import DarkModeIcon from '@/shared/ui/icons/DarkModeIcon';
import LightModeIcon from '@/shared/ui/icons/LightModeIcon';

const ThemeModeSwitch: FC = () => {
  const { isDarkMode, toggleColorMode } = useTheme();

  return (
    <IconButton onClick={toggleColorMode}>
      {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
};

export default ThemeModeSwitch;
