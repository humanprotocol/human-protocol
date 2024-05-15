import { Grid, Typography } from '@mui/material';
import React from 'react';

export interface PageHeaderProps {
  headerIcon: React.ReactNode;
  headerText: string;
}

export function PageHeader({ headerIcon, headerText }: PageHeaderProps) {
  return (
    <Grid container>
      <Grid alignContent="center" container gap="1rem" justifyContent="start">
        <Grid
          sx={{
            height: '70px',
            width: '70px',
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '50%',
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
          }}
        >
          <Typography variant="h3">{headerText}</Typography>
        </div>
      </Grid>
    </Grid>
  );
}
