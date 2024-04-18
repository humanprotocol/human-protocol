import { Box, Stack, Typography } from '@mui/material';
import { colorPalette } from '@/styles/color-palette';

interface ChipsProps {
  data: string[];
}

interface ChipComponentProps {
  label: string;
  key: string;
  backgroundColor?: string;
}

export function ChipComponent({
  label,
  key,
  backgroundColor,
}: ChipComponentProps) {
  return (
    <Box
      key={key}
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

export function Chips({ data }: ChipsProps) {
  return (
    <Stack direction="row" spacing={1}>
      {data.map((jobType) => (
        <ChipComponent key={crypto.randomUUID()} label={jobType} />
      ))}
    </Stack>
  );
}
