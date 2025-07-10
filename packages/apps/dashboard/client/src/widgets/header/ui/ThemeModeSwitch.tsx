import type { FC } from 'react';

import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';

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
