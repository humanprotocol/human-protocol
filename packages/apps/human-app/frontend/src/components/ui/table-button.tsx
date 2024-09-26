import Typography from '@mui/material/Typography';
import type { CustomButtonProps } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { useColorMode } from '@/hooks/use-color-mode';

export function TableButton(props: CustomButtonProps) {
  const { colorPalette } = useColorMode();

  return (
    <Button
      {...props}
      size="small"
      sx={{
        backgroundColor: colorPalette.secondary.main,
        paddingTop: '0.4rem',
        color: 'white',
        paddingBottom: '0.4rem',
        whiteSpace: 'nowrap',
        textWrap: 'nowrap',
        ...props.sx,
      }}
      type="button"
      variant="contained"
    >
      <Typography
        color="white"
        sx={{ color: 'white !important' }}
        variant="buttonSmall"
      >
        {props.children}
      </Typography>
    </Button>
  );
}
