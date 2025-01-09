import { useCallback } from 'react';
import { useSnackbar, type SnackbarKey } from 'notistack';
import CloseIcon from '@mui/icons-material/Close';
import { type ShowNotifProps } from '@/shared/types/notifications';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { colorPalette as lightColorPalette } from '@/shared/styles/color-palette';
import { breakpoints } from '@/shared/styles/breakpoints';

const AUTO_HIDE_NOTIFICATION = 6000;

export const useNotification = () => {
  const { colorPalette } = useColorMode();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const fontColor = lightColorPalette.white;

  const action = useCallback(
    (snackbarId: SnackbarKey) => (
      <CloseIcon
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
          width: '100%',
          backgroundColor:
            type === 'success'
              ? colorPalette.success.main
              : colorPalette.secondary.main,
          color: fontColor,
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
    [enqueueSnackbar, colorPalette, fontColor, action]
  );

  return { showNotification };
};
