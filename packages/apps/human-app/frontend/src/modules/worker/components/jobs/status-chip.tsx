import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { type MyJob } from '@/modules/worker/services/my-jobs-data';
import { colorPalette as lightModeColorPalette } from '@/shared/styles/color-palette';
import { getChipStatusColor } from '@/modules/worker/utils/get-chip-status-color';
import { useColorMode } from '@/shared/hooks/use-color-mode';

export function StatusChip({ status }: { status: MyJob['status'] }) {
  const { colorPalette } = useColorMode();

  return (
    <Box
      sx={{
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '6px 9px',
        color: lightModeColorPalette.white,
        backgroundColor: getChipStatusColor(status, colorPalette),
        borderRadius: '16px',
      }}
    >
      <Typography color={lightModeColorPalette.white} variant="chip">
        {status}
      </Typography>
    </Box>
  );
}
