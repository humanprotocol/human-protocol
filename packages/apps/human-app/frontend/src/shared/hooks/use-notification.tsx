import { useCallback } from 'react';
import { type SnackbarKey, useSnackbar } from 'notistack';
import CloseIcon from '@mui/icons-material/Close';

import { ColorPalette } from '@/shared/styles/color-palette';
import { useColorMode } from '../contexts/color-mode';

export enum TopNotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
}

export interface ShowNotifProps {
  message: string;
  type: TopNotificationType;
  durationMs?: number;
}

const AUTO_HIDE_NOTIFICATION_MS = 6000;

const mapTopNotificationTypeToColor = (
  type: TopNotificationType,
  colorPalette: ColorPalette
) => {
  switch (type) {
    case TopNotificationType.SUCCESS:
      return colorPalette.success.main;
    case TopNotificationType.WARNING:
      return colorPalette.secondary.main;
    case TopNotificationType.ERROR:
      return '#FF6262';
    default:
      return colorPalette.secondary.main;
  }
};

export const useNotification = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { colorPalette } = useColorMode();

  const action = useCallback(
    (snackbarId: SnackbarKey) => (
      <CloseIcon
        sx={{
          width: '20px',
          height: '20px',
          zIndex: 1,
          cursor: 'pointer',
          marginRight: '4px',
          alignSelf: 'flex-start',
        }}
        onClick={() => {
          closeSnackbar(snackbarId);
        }}
      />
    ),
    [closeSnackbar]
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
          display: 'flex',
          flexWrap: 'nowrap',
          width: '100%',
          maxWidth: '100%',
          backgroundColor: mapTopNotificationTypeToColor(type, colorPalette),
          color: colorPalette.white,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 0.1,
        },
        action,
      });
    },
    [enqueueSnackbar, action, colorPalette]
  );

  return { showNotification };
};
