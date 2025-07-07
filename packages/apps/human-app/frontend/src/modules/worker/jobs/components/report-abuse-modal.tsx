/* eslint-disable camelcase */
import { useState } from 'react';
import { Box, Button, Stack, Typography, TextField } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { colorPalette } from '@/shared/styles/color-palette';
import { useReportAbuseMutation } from '../available-jobs/hooks/use-report-abuse';

interface ReportAbuseModalProps {
  escrowAddress: string;
  chainId: number;
  close: () => void;
}

function ErrorState({
  error,
  onClose,
}: {
  error: string;
  onClose: () => void;
}) {
  const errorColor = colorPalette.error.main;
  return (
    <Stack justifyContent="center" alignItems="center" gap={3}>
      <ErrorIcon sx={{ color: errorColor, width: 40, height: 40 }} />
      <Typography color={errorColor} variant="body2">
        {error}
      </Typography>
      <Button variant="outlined" fullWidth onClick={onClose}>
        Close
      </Button>
    </Stack>
  );
}

function SuccessState({ onClose }: { onClose: () => void }) {
  return (
    <Stack justifyContent="center" alignItems="center" gap={3}>
      <CheckCircleIcon
        sx={{ color: colorPalette.success.main, width: 40, height: 40 }}
      />
      <Button variant="outlined" fullWidth onClick={onClose}>
        Close
      </Button>
    </Stack>
  );
}

export function ReportAbuseModal({
  escrowAddress,
  chainId,
  close,
}: Readonly<ReportAbuseModalProps>) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const isMobile = useIsMobile();

  const {
    mutate: reportAbuseMutation,
    isSuccess,
    isError,
    isIdle,
  } = useReportAbuseMutation({
    onError: (status) => {
      if (status === 422) {
        setError('Abuse has already been reported');
      } else {
        setError('Something went wrong');
      }
    },
  });

  const handleReportAbuse = () => {
    reportAbuseMutation({
      escrow_address: escrowAddress,
      chain_id: chainId,
      reason: reason.trim(),
    });
  };

  return (
    <Stack
      px={{ xs: 1, md: 5 }}
      pt={{ xs: 0, md: 3.5 }}
      pb={{ xs: 1.5, md: 5.5 }}
    >
      <Typography variant="h4" mb={2}>
        Report Abuse
      </Typography>
      {isError && <ErrorState error={error} onClose={close} />}
      {isSuccess && <SuccessState onClose={close} />}
      {isIdle && (
        <>
          <Typography variant={isMobile ? 'body2' : 'body1'}>
            Notice something inappropriate or incorrect? Let us know if this
            task contains harmful, offensive, or misleading content. Your report
            reviewed confidentially.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason"
            value={reason}
            sx={{
              my: { xs: 4, md: 5 },
            }}
            onChange={(e) => {
              setReason(e.target.value);
            }}
          />
          <Box display="flex" gap={2}>
            <Button fullWidth onClick={close} variant="outlined">
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={() => {
                handleReportAbuse();
              }}
              variant="contained"
              disabled={!reason.trim()}
            >
              {isMobile ? 'Report' : 'Report Abuse'}
            </Button>
          </Box>
        </>
      )}
    </Stack>
  );
}
