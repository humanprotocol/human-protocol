import type { z } from 'zod';
import { Grid, Typography } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { colorPalette } from '@/styles/color-palette';

export interface PasswordCheck {
  schema: z.ZodSchema;
  requirementsLabel: string;
}

const getColor = (isSubmitted: boolean, isValid: boolean) => {
  if (isSubmitted) {
    if (isValid) {
      return colorPalette.success.dark;
    }
    return colorPalette.error.main;
  }

  if (isValid) {
    return colorPalette.success.dark;
  }

  return colorPalette.text.primary;
};

const getIcon = (isSubmitted: boolean, isValid: boolean) => {
  if (isSubmitted) {
    if (isValid) {
      return <CheckCircleIcon sx={{ fill: getColor(isSubmitted, isValid) }} />;
    }
    return <CancelIcon sx={{ fill: getColor(isSubmitted, isValid) }} />;
  }

  if (isValid) {
    return <CheckCircleIcon sx={{ fill: getColor(isSubmitted, isValid) }} />;
  }
  return <CheckCircleIcon sx={{ fill: colorPalette.text.disabled }} />;
};

export function PasswordCheckLabel({
  schema,
  password,
  requirementsLabel,
  isSubmitted,
}: PasswordCheck & { password: unknown; isSubmitted: boolean }) {
  const isValid = schema.safeParse(password).success;

  return (
    <Grid
      alignItems="center"
      container
      gap="0.5rem"
      justifyContent="start"
      width="unset"
    >
      {getIcon(isSubmitted, isValid)}
      <Typography color={getColor(isSubmitted, isValid)} variant="helperText">
        {requirementsLabel}
      </Typography>
    </Grid>
  );
}
