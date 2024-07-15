import Grid from '@mui/material/Grid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { colorPalette } from '@/styles/color-palette';

export function SuccessLabel({ children }: { children: string }) {
  return (
    <Grid container gap="1rem" sx={{ alignItems: 'center' }}>
      <span>{children}</span>
      <CheckCircleIcon
        fontSize="large"
        sx={{ fill: colorPalette.success.main }}
      />
    </Grid>
  );
}
