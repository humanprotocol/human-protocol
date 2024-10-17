import { Box, Typography } from '@mui/material';
import { useColorMode } from '@/hooks/use-color-mode';

interface ChipProps {
  label: string;
  key?: string;
  backgroundColor?: string;
}
export function Chip({ label, backgroundColor }: ChipProps) {
  const { colorPalette } = useColorMode();

  return (
    <Box
      component="span"
      key={crypto.randomUUID()}
      sx={{
        backgroundColor: backgroundColor
          ? backgroundColor
          : colorPalette.chip.main,
        width: 'fit-content',
        px: '10px',
        py: '6px',
        borderRadius: '16px',
        display: 'flex',
        whiteSpace: 'wrap',
      }}
    >
      <Typography
        color={backgroundColor ? colorPalette.white : colorPalette.text.primary}
        variant="chip"
        sx={{
          wordBreak: 'break-all',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
