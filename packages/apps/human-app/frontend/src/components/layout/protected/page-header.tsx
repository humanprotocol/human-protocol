import { Grid, Typography } from '@mui/material';
import React from 'react';

interface PageHeaderProps {
  headerIcon: React.ReactNode;
  headerText: string;
  backgroundColor?: string;
}

export function PageHeader({
  headerIcon,
  headerText,
  backgroundColor,
}: PageHeaderProps) {
  return (
    <Grid
      alignContent="center"
      container
      sx={{
        paddingTop: '70px',
        backgroundColor: backgroundColor ? backgroundColor : 'transparent',
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
