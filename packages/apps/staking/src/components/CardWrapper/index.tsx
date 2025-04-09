import { FC, PropsWithChildren } from 'react';
import Paper from '@mui/material/Paper';

type Props = {
  size?: 'sm' | 'lg';
};

const CardWrapper: FC<PropsWithChildren<Props>> = ({
  children,
  size = 'sm',
}) => {
  return (
    <Paper
      elevation={3}
      sx={{
        py: { xs: 3, sm: 2, md: 2, lg: 3 },
        px: { xs: 2, sm: 2, md: 2, lg: 4 },
        height: size === 'sm' ? '112px' : '248px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        borderRadius: '20px',
        boxShadow: 'none',
        position: 'relative',
        border: '1px solid #DADCE8',
        width: '100%',
      }}
    >
      {children}
    </Paper>
  );
};

export default CardWrapper;
