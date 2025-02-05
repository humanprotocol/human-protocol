import Grid from '@mui/material/Grid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useColorMode } from '@/shared/contexts/color-mode';

export function SuccessLabel({ children }: { children: string }) {
  const { colorPalette } = useColorMode();

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
