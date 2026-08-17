import type { ReactNode } from 'react';
import { Paper, SxProps, Theme } from '@mui/material';

type PageCardProps = {
  children: ReactNode;
  sx?: SxProps<Theme>;
};

export function PageCard({ sx, children }: PageCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flex: 1,
        alignSelf: 'stretch',
        my: { xs: 0, md: 4 },
        borderRadius: '30px',
        borderBottomLeftRadius: { xs: 0, md: '30px' },
        borderBottomRightRadius: { xs: 0, md: '30px' },
        border: { xs: 'none', md: '1px solid' },
        borderColor: (theme) => ({
          xs: 'none',
          md: theme.palette.border.main,
        }),
        overflow: 'hidden',
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}
