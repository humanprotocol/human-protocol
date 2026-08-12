import { useCallback } from 'react';
import { type SnackbarKey, useSnackbar } from 'notistack';
import CloseIcon from '@mui/icons-material/Close';
import { Palette, useTheme } from '@mui/material';

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
  palette: Palette
) => {
  switch (type) {
    case TopNotificationType.SUCCESS:
      return palette.success.main;
    case TopNotificationType.WARNING:
      return palette.secondary.main;
    case TopNotificationType.ERROR:
      return palette.error.main;
    default:
      return palette.secondary.main;
  }
};

export const useNotification = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const theme = useTheme();

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
          backgroundColor: mapTopNotificationTypeToColor(type, theme.palette),
          color: theme.palette.common.white,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 0.1,
        },
        action,
      });
    },
    [enqueueSnackbar, action, theme.palette]
  );

  return { showNotification };
};
