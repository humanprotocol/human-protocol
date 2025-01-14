import { useCallback } from 'react';
import { useSnackbar, type SnackbarKey } from 'notistack';
import CloseIcon from '@mui/icons-material/Close';
import { type ShowNotifProps } from '@/shared/types/notifications';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { colorPalette as lightColorPalette } from '@/shared/styles/color-palette';
import { breakpoints } from '@/shared/styles/breakpoints';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

const AUTO_HIDE_NOTIFICATION = 6000;
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
    [closeSnackbar]
  );

  const showNotification = useCallback(
    ({ message, type, duration = AUTO_HIDE_NOTIFICATION }: ShowNotifProps) => {
      enqueueSnackbar(message, {
        variant: type,
        autoHideDuration: duration,
        style: {
          width: `calc(100svw - ${isMobile ? '32px' : '348px'})`,
          marginRight: isMobile ? '18px' : '36px',
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
