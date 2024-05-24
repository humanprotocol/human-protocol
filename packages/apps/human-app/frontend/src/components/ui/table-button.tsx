import Typography from '@mui/material/Typography';
import type { CustomButtonProps } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { colorPalette } from '@/styles/color-palette';

export function TableButton(props: CustomButtonProps) {
  return (
    <Button
      {...props}
      size="small"
      sx={{
        backgroundColor: colorPalette.secondary.main,
        color: colorPalette.white,
        paddingTop: '0.4rem',
        paddingBottom: '0.4rem',
      }}
      type="button"
      variant="contained"
    >
      <Typography color={colorPalette.white} variant="buttonSmall">
        {props.children}
      </Typography>
    </Button>
  );
}
