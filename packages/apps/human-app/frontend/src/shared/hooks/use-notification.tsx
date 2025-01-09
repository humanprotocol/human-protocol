import { useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { type ShowNotifProps } from '@/shared/types/notifications';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { colorPalette as lightColorPalette } from '@/shared/styles/color-palette';
import { breakpoints } from '@/shared/styles/breakpoints';

const AUTO_HIDE_NOTIFICATION = 6000;

export const useNotification = () => {
  const { colorPalette } = useColorMode();
  const { enqueueSnackbar } = useSnackbar();
  const fontColor = lightColorPalette.white;

  const showNotification = useCallback(
    ({ message, type, duration = AUTO_HIDE_NOTIFICATION }: ShowNotifProps) => {
      enqueueSnackbar(message, {
        variant: type,
        autoHideDuration: duration,
        style: {
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
      });
    },
    [enqueueSnackbar, colorPalette, fontColor]
  );

  return { showNotification };
};
