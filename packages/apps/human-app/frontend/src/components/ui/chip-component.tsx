import { Box, Typography } from '@mui/material';
import { colorPalette } from '@/styles/color-palette';

interface ChipComponentProps {
  label: string;
  key: string;
  backgroundColor?: string;
}
export function ChipComponent({ label, backgroundColor }: ChipComponentProps) {
  return (
    <Box
      key={crypto.randomUUID()}
      sx={{
        backgroundColor: backgroundColor
          ? backgroundColor
          : colorPalette.chip.main,
        width: 'fit-content',
        px: '10px',
        py: '5px',
        borderRadius: '16px',
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
