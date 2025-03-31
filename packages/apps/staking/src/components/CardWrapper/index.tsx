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
        py: 3,
        px: 4,
        height: size === 'sm' ? '112px' : '248px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        borderRadius: '20px',
        boxShadow: 'none',
        position: 'relative',
      }}
    >
      {children}
    </Paper>
  );
};

export default CardWrapper;
