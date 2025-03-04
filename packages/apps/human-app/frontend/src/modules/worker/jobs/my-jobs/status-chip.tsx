import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { colorPalette as lightModeColorPalette } from '@/shared/styles/color-palette';
import { useColorMode } from '@/shared/contexts/color-mode';
import { type MyJob } from '../components';
import { getChipStatusColor } from './utils/get-chip-status-color';

export function StatusChip({ status }: Readonly<{ status: MyJob['status'] }>) {
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
