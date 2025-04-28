import { FC, PropsWithChildren } from 'react';

import { Paper, useTheme } from '@mui/material';

type Props = {
  size?: 'sm' | 'lg';
};

const CardWrapper: FC<PropsWithChildren<Props>> = ({
  children,
  size = 'sm',
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Paper
      sx={{
        py: { xs: 3, sm: 2, md: 2, lg: 3 },
        px: { xs: 2, sm: 2, md: 2, lg: 4 },
        background: isDarkMode
          ? theme.palette.elevation.medium
          : theme.palette.background.default,
        height: size === 'sm' ? '112px' : '248px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        borderRadius: '20px',
        boxShadow: 'none',
        position: 'relative',
        border: isDarkMode ? 'none' : '1px solid #DADCE8',
        width: '100%',
      }}
    >
      {children}
    </Paper>
  );
};

export default CardWrapper;
