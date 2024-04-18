import { Grid, Typography } from '@mui/material';
import React from 'react';

interface PageHeaderProps {
  headerIcon: React.ReactNode;
  headerText: string;
}

export function PageHeader({ headerIcon, headerText }: PageHeaderProps) {
  return (
    <Grid
      alignContent="center"
      container
      sx={{
        paddingTop: '70px',
      }}
    >
      <Grid item>{headerIcon}</Grid>
      <Grid
        item
        sx={{
          marginTop: '10px',
        }}
      >
        <Typography variant="h3">{headerText}</Typography>
      </Grid>
    </Grid>
  );
}
