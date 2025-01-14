import { useCallback } from 'react';
import { useSnackbar, type SnackbarKey } from 'notistack';
import CloseIcon from '@mui/icons-material/Close';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { colorPalette as lightColorPalette } from '@/shared/styles/color-palette';
import { breakpoints } from '@/shared/styles/breakpoints';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

export type TopNotificationType = 'success' | 'warning';

export interface ShowNotifProps {
  message: string;
  type: TopNotificationType;
  durationMs?: number;
}

const AUTO_HIDE_NOTIFICATION_MS = 116000;
const FONT_COLOR = lightColorPalette.white;

export const useNotification = () => {
  const { colorPalette } = useColorMode();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const isMobile = useIsMobile();

  const action = useCallback(
    (snackbarId: SnackbarKey) => (
      <CloseIcon
        sx={{
          width: '20px',
          position: 'absolute',
          top: '15px',
          right: isMobile ? '5px' : '38px',
          height: '20px',
          zIndex: 1,
          cursor: 'pointer',
          marginRight: '4px',
        }}
        onClick={() => {
          closeSnackbar(snackbarId);
        }}
      />
    ),
    [closeSnackbar, isMobile]
  );

  const showNotification = useCallback(
    ({
      message,
      type,
      durationMs = AUTO_HIDE_NOTIFICATION_MS,
    }: ShowNotifProps) => {
      enqueueSnackbar(message, {
        variant: type,
        autoHideDuration: durationMs,
        style: {
          width: `calc(100svw - ${isMobile ? '32px' : '344px'})`,
          marginRight: isMobile ? '18px' : '32px',
          backgroundColor:
            type === 'success'
              ? colorPalette.success.main
              : colorPalette.secondary.main,
          color: FONT_COLOR,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 0.1,
          [breakpoints.mobile]: {
            fontSize: 14,
          },
        },
        action,
      });
    },
    [enqueueSnackbar, colorPalette, action, isMobile]
  );

  return { showNotification };
};
