import { useState } from 'react';
import {
  Box,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import SuccessIcon from '@mui/icons-material/CheckCircle';
import { useTranslation } from 'react-i18next';

import { ResponsiveOverlay } from '@/shared/components/ui/responsive-overlay';
import { useReportAbuseMutation } from '../available-jobs/hooks/use-report-abuse';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { Button } from '@/shared/components/ui/button';
import { useColorMode } from '@/shared/contexts/color-mode/use-color-mode';
import { Loader } from '@/shared/components/ui/loader';

type Props = {
  open: boolean;
  onClose: () => void;
  escrowAddress: string;
  chainId: number;
};

const ABUSE_ERROR = 'Abuse has already been reported';

const REASON_OPTIONS = [
  'sexual_content',
  'nudity',
  'violence',
  'gore',
  'hate_or_racism',
  'drugs',
  'terrorism',
  'child_abuse',
  'self_harm',
  'weapons',
  'criminal_activity',
] as const;

function ErrorState({ error }: { error: string }) {
  const { t } = useTranslation();
  const { colorPalette } = useColorMode();

  const isAbuseError = error === ABUSE_ERROR;
  const errorColor = colorPalette.error.main;

  return (
    <Stack
      sx={{
        alignItems: 'center',
        textAlign: { xs: 'center', md: 'left' },
        gap: 2,
        my: { xs: 3, md: 5 },
        px: 2,
      }}
    >
      <ErrorIcon sx={{ color: errorColor, width: 40, height: 40 }} />
      {isAbuseError ? (
        <>
          <Typography
            component="p"
            variant="h5"
            sx={{ fontWeight: 700, color: errorColor }}
          >
            {t('worker.reportAbuse.modalHeaderAlreadyReportedError')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: errorColor,
            }}
          >
            {t('worker.reportAbuse.modalParagraphAlreadyReportedError')}
          </Typography>
        </>
      ) : (
        <Typography variant="body1" sx={{ color: errorColor }}>
          {t('worker.reportAbuse.modalUnknownError')}
        </Typography>
      )}
    </Stack>
  );
}

function SuccessState() {
  const { t } = useTranslation();
  const { colorPalette } = useColorMode();

  return (
    <Stack
      sx={{
        alignItems: 'center',
        gap: 2,
        my: { xs: 3, md: 5 },
        px: 2,
      }}
    >
      <SuccessIcon
        sx={{ color: colorPalette.success.main, width: 40, height: 40 }}
      />
      <Typography
        component="p"
        variant="h5"
        sx={{ fontWeight: 700, color: colorPalette.text.auxiliary100 }}
      >
        {t('worker.reportAbuse.modalSuccessHeader')}
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: colorPalette.text.auxiliary100 }}
      >
        {t('worker.reportAbuse.modalSuccessParagraph')}
      </Typography>
    </Stack>
  );
}

export function ReportAbuseDialog({
  open,
  onClose,
  escrowAddress,
  chainId,
}: Props) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const { t } = useTranslation();
  const { colorPalette } = useColorMode();
  const isMobile = useIsMobile();

  const {
    mutate: reportAbuseMutation,
    isSuccess,
    isError,
    isIdle,
    isPending,
  } = useReportAbuseMutation({
    onError: (status) => {
      if (status === 422) {
        setError(ABUSE_ERROR);
      } else {
        setError('Something went wrong');
      }
    },
  });

  const isIdleOrLoading = isIdle || isPending;

  const handleReportAbuse = () => {
    if (!reason.length) {
      return;
    }

    reportAbuseMutation({
      escrow_address: escrowAddress,
      chain_id: chainId,
      reason,
    });
  };

  return (
    <ResponsiveOverlay
      open={open}
      onClose={onClose}
      desktopSx={{ px: 0, pt: 4, pb: 0, width: '660px' }}
      mobileSx={{ px: 0, pt: 2, pb: 0, height: '60dvh' }}
    >
      <Stack sx={{ px: 2 }}>
        <Typography
          variant="h6"
          sx={{ mb: 4, color: colorPalette.text.auxiliary100, fontWeight: 700 }}
        >
          {t('worker.reportAbuse.modalHeader')}
        </Typography>
        {isIdleOrLoading && (
          <>
            <Typography
              variant={isMobile ? 'body2' : 'body1'}
              sx={{ color: colorPalette.text.auxiliary200 }}
            >
              {t('worker.reportAbuse.modalParagraph')}
            </Typography>
            <FormControl fullWidth sx={{ my: { xs: 2, md: 3 } }}>
              <Select
                value={reason}
                displayEmpty
                sx={{
                  color: colorPalette.text.auxiliary100,
                  '& .MuiSelect-select': {
                    color: colorPalette.text.auxiliary100,
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: colorPalette.text.auxiliary100,
                  },
                }}
                onChange={(e) => {
                  setReason(e.target.value);
                }}
              >
                {REASON_OPTIONS.map((value) => (
                  <MenuItem key={value} value={value}>
                    {t(`worker.reportAbuse.reasons.${value}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}
      </Stack>
      {isPending && (
        <Stack sx={{ alignItems: 'center', mb: 2, mx: 'auto' }}>
          <Loader />
        </Stack>
      )}
      {isError && <ErrorState error={error} />}
      {isSuccess && <SuccessState />}
      <Box
        sx={{
          display: 'flex',
          mt: 'auto',
          p: 2,
          gap: 2,
          width: '100%',
          borderTop: `1px solid ${colorPalette.border.main}`,
        }}
      >
        <Button
          variant="outlined"
          fullWidth
          disabled={isPending}
          sx={{
            color: colorPalette.text.auxiliary100,
            borderColor: colorPalette.text.auxiliary100,
          }}
          onClick={onClose}
        >
          {isIdleOrLoading
            ? t('worker.reportAbuse.cancel')
            : t('worker.reportAbuse.close')}
        </Button>
        <Button
          variant="contained"
          color="accent"
          fullWidth
          disabled={!reason || isPending}
          sx={{ display: isIdleOrLoading ? 'flex' : 'none' }}
          onClick={handleReportAbuse}
        >
          {isMobile
            ? t('worker.reportAbuse.report')
            : t('worker.reportAbuse.reportAbuse')}
        </Button>
      </Box>
    </ResponsiveOverlay>
  );
}
