import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useColorMode } from '@/shared/contexts/color-mode';
import { getChipStatusColor } from '../../utils';
import { type MyJob } from '../../../schemas';

export function StatusChip({ status }: Readonly<{ status: MyJob['status'] }>) {
  const { colorPalette } = useColorMode();

  return (
    <Box
      sx={{
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '6px 9px',
        color: colorPalette.white,
        backgroundColor: getChipStatusColor(status, colorPalette),
        borderRadius: '16px',
      }}
    >
      <Typography color={colorPalette.white} variant="chip">
        {status}
      </Typography>
    </Box>
  );
}
