import { Grid, Typography } from '@mui/material';
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
}: Readonly<PageHeaderProps>) {
  const isMobile = useIsMobile();
  return (
    <Grid
      alignContent="space-between"
      container
      gap="1rem"
      justifyContent="space-between"
      sx={{
        padding: '0 34px',
        [breakpoints.mobile]: {
          padding: '0',
        },
      }}
    >
      <div>
        <Grid alignContent="center" container gap="1rem" justifyContent="start">
          <Grid
            sx={{
              height: '76px',
              width: '70px',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '30%',
                left: '50%',
                transform: 'translate(-50%,-30%)',
              }}
            >
              {headerIcon}
            </span>
          </Grid>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'nowrap',
            }}
          >
            <Typography sx={{ textWrap: 'nowrap' }} variant="h3">
              {headerText}
            </Typography>
          </div>
        </Grid>
      </div>
      {!isMobile ? <Grid>{headerItem}</Grid> : null}
    </Grid>
  );
}
