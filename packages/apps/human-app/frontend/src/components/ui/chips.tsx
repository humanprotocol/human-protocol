import { Box, Stack, Typography } from '@mui/material';
import { colorPalette } from '@/styles/color-palette';

interface ChipsProps {
  data: string[];
}

export function Chips({ data }: ChipsProps) {
  return (
    <Stack direction="row" spacing={1}>
      {data.map((jobType) => (
        <Box
          key={jobType}
          sx={{
            backgroundColor: colorPalette.chip.main,
            width: 'fit-content',
            px: '10px',
            py: '5px',
            borderRadius: '16px',
          }}
        >
          <Typography variant="chip">{jobType}</Typography>
        </Box>
      ))}
    </Stack>
  );
}
