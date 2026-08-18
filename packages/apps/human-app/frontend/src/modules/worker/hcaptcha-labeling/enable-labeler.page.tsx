import { useEffect } from 'react';
import { t } from 'i18next';
import { Box, Paper, Stack, Typography } from '@mui/material';

import { Button } from '@/shared/components/ui/button';
import { getErrorMessageForError } from '@/shared/errors';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { useEnableHCaptchaLabelingMutation } from './hooks';
import { Breadcrumbs } from './components/breadcrumbs';

export function EnableLabelerPage() {
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
          py: { xs: 2, md: 6 },
          px: { xs: 2, md: 4 },
          borderBottom: (theme) => ({
            xs: 'none',
            md: `1px solid ${theme.palette.border.main}`,
          }),
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
            bgcolor: { xs: 'transparent', md: 'background.subtle' },
            borderRadius: '20px',
            border: (theme) => ({
              xs: 'none',
              md: `1px solid ${theme.palette.border.strong}`,
            }),
          }}
        >
          <Stack
            sx={{
              width: { xs: 'unset', sm: '350px' },
              gap: { xs: 3, md: 5 },
            }}
          >
            <Typography variant="body4" sx={{ color: 'text.auxiliary100' }}>
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
