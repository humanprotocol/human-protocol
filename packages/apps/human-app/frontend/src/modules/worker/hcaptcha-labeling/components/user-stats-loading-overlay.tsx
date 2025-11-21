import { Box, type SxProps, Typography } from '@mui/material';
import { t } from 'i18next';
import { useColorMode } from '@/shared/contexts/color-mode';
import { Loader } from '@/shared/components/ui/loader';

export function LoadingOverlay({ sx }: { sx?: SxProps }) {
  const { isDarkMode } = useColorMode();
  return (
    <Box
      sx={{
        content: '" "',
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        backgroundColor: isDarkMode
          ? 'rgba(38, 29, 71, 0.90)'
          : 'rgba(255, 255, 255, 0.90)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        zIndex: 1,
        borderRadius: '16px',
        ...sx,
      }}
    >
      <Loader size={32} />
      <Typography variant="body1">
        {t('worker.hcaptchaLabelingStats.loadingLiveStatistics')}
      </Typography>
    </Box>
  );
}
