import { Box, Typography } from '@mui/material';
import { colorPalette } from '@/styles/color-palette';

interface ChipProps {
  label: string;
  key?: string;
  backgroundColor?: string;
}
export function Chip({ label, backgroundColor }: ChipProps) {
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
        py: '2px',
        borderRadius: '16px',
        display: 'flex',
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
