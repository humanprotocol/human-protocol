import { Box, Typography } from '@mui/material';
import { useColorMode } from '@/shared/contexts/color-mode';

interface ChipProps {
  label: string | React.ReactElement;
  backgroundColor?: string;
}

export function Chip({ label, backgroundColor }: Readonly<ChipProps>) {
  const { colorPalette } = useColorMode();

  return (
    <Box
      component="span"
      sx={{
        backgroundColor: backgroundColor ?? colorPalette.chip.main,
        width: 'fit-content',
        px: '10px',
        py: '2px',
        borderRadius: '16px',
        display: 'flex',
        wordBreak: 'break-word',
      }}
    >
      <Typography
        color={backgroundColor ? colorPalette.white : colorPalette.text.primary}
        variant="chip"
      >
        {label}
      </Typography>
    </Box>
  );
}
