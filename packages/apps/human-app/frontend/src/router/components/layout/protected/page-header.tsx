import { Box, Grid, Typography } from '@mui/material';
import React from 'react';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { breakpoints } from '@/shared/styles/breakpoints';

export interface PageHeaderProps {
  headerIcon: React.ReactNode;
  headerText: string;
  headerItem?: React.ReactNode;
}

export function PageHeader({
  headerIcon,
  headerText,
  headerItem,
}: PageHeaderProps) {
  const isMobile = useIsMobile();
  return (
    <Grid
      container
      sx={{
        alignItems: 'space-between',
        justifyContent: 'space-between',
        px: 4,
        gap: 2,
        [breakpoints.mobile]: {
          px: 0,
        },
      }}
    >
      <Grid
        container
        sx={{ alignItems: 'center', justifyContent: 'start', gap: 2 }}
      >
        <Grid
          sx={{
            height: '76px',
            width: '70px',
            position: 'relative',
          }}
        >
          <Box
            component="span"
            sx={{
              position: 'absolute',
              top: '30%',
              left: '50%',
              transform: 'translate(-50%,-30%)',
            }}
          >
            {headerIcon}
          </Box>
        </Grid>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'nowrap',
          }}
        >
          <Typography sx={{ textWrap: 'nowrap' }} variant="h3">
            {headerText}
          </Typography>
        </Box>
      </Grid>
      {!isMobile ? <Grid>{headerItem}</Grid> : null}
    </Grid>
  );
}
