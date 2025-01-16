import { useCallback } from 'react';
import { type SnackbarKey, useSnackbar } from 'notistack';
import CloseIcon from '@mui/icons-material/Close';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { colorPalette as lightColorPalette } from '@/shared/styles/color-palette';
import { breakpoints } from '@/shared/styles/breakpoints';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

export enum TopNotificationType {
  SUCCESS = 'success',
  WARNING = 'warning',
}

export interface ShowNotifProps {
  message: string;
  type: TopNotificationType;
  durationMs?: number;
}

const widthStylesForDesktop = {
  width: 'calc(100vw - 344px)',
};

const AUTO_HIDE_NOTIFICATION_MS = 6000;
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
          marginRight: isMobile ? '0' : '32px',
          maxWidth: '100%',
          backgroundColor:
            type === TopNotificationType.SUCCESS
              ? colorPalette.success.main
              : colorPalette.secondary.main,
          color: FONT_COLOR,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 0.1,
          [breakpoints.mobile]: {
            fontSize: 14,
          },
          ...(isMobile ? {} : widthStylesForDesktop),
        },
        action,
      });
    },
    [enqueueSnackbar, colorPalette, action, isMobile]
  );

  return { showNotification };
};
