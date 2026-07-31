import { useEffect } from 'react';
import { t } from 'i18next';
import { Box, Paper, Stack, Typography } from '@mui/material';

import { Button } from '@/shared/components/ui/button';
import { getErrorMessageForError } from '@/shared/errors';
import { useColorMode } from '@/shared/contexts/color-mode/use-color-mode';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { useEnableHCaptchaLabelingMutation } from './hooks';
import { Breadcrumbs } from './components/breadcrumbs';

export function EnableLabelerPage() {
  const { colorPalette } = useColorMode();
  const { showNotification } = useNotification();
  const { mutate, error, isError, isPending, reset } =
    useEnableHCaptchaLabelingMutation();

  useEffect(() => {
    if (isError) {
      showNotification({
        message: getErrorMessageForError(error),
        type: TopNotificationType.ERROR,
      });
      reset();
    }
  }, [error, isError, showNotification, reset]);

  return (
    <Stack
      sx={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}
    >
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          pt: { xs: 2, md: 2 },
          pb: { xs: 2, md: 6 },
          px: { xs: 2, md: 4 },
          borderBottom: {
            xs: 'none',
            md: `1px solid ${colorPalette.border.main}`,
          },
        }}
      >
        <Breadcrumbs />
      </Box>
      <Stack
        sx={{
          width: '100%',
          flex: 1,
          px: { xs: 2, md: 4 },
          py: { xs: 0, md: 6 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: { xs: 'transparent', md: colorPalette.background.subtle },
            borderRadius: '20px',
            border: {
              xs: 'none',
              md: `1px solid ${colorPalette.border.strong}`,
            },
          }}
        >
          <Stack
            sx={{
              width: { xs: 'unset', sm: '350px' },
              gap: { xs: 3, md: 5 },
            }}
          >
            <Typography
              variant="body1"
              sx={{ color: colorPalette.text.auxiliary100 }}
            >
              {t('worker.enableHCaptchaLabeling.description')}
            </Typography>
            <Button
              variant="contained"
              color="accent"
              fullWidth
              disabled={isPending}
              onClick={() => {
                mutate();
              }}
            >
              {t('worker.enableHCaptchaLabeling.enableButton')}
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Stack>
  );
}
