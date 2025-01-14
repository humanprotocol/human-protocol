import { Box, Typography } from '@mui/material';
import { useColorMode } from '@/shared/hooks/use-color-mode';

interface ChipProps {
  label: string | React.ReactElement;
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
