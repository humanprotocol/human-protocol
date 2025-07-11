/* eslint-disable camelcase */
import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
  TextField,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import SuccessIcon from '@mui/icons-material/CheckCircle';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { colorPalette } from '@/shared/styles/color-palette';
import { useReportAbuseMutation } from '../available-jobs/hooks/use-report-abuse';

interface ReportAbuseModalProps {
  escrowAddress: string;
  chainId: number;
  close: () => void;
}

const ABUSE_ERROR = 'Abuse has already been reported';

function ErrorState({ error }: { error: string }) {
  const isAbuseError = error === ABUSE_ERROR;
  const errorColor = colorPalette.error.main;
  return (
    <Stack alignItems="center" textAlign="center" gap={2} my={5}>
      <ErrorIcon sx={{ color: errorColor, width: 40, height: 40 }} />
      {isAbuseError ? (
        <>
          <Typography
            component="p"
            variant="h5"
            fontWeight={700}
            color={errorColor}
          >
            Report Already Submitted
          </Typography>
          <Typography variant="body1" color={errorColor}>
            This case of abuse has already been reported. Our team is currently
            reviewing it.
          </Typography>
        </>
      ) : (
        <Typography variant="body1" color={errorColor}>
          Something went wrong.
        </Typography>
      )}
    </Stack>
  );
}

function SuccessState() {
  return (
    <Stack alignItems="center" textAlign="center" gap={2} my={5}>
      <SuccessIcon
        sx={{ color: colorPalette.success.main, width: 40, height: 40 }}
      />
      <Typography component="p" variant="h5" fontWeight={700}>
        Thank you!
      </Typography>
      <Typography variant="body1">
        Your issue has been successfully reported. Our team has received the
        details and will review them shortly.
      </Typography>
    </Stack>
  );
}

export function ReportAbuseModal({
  escrowAddress,
  chainId,
  close,
}: ReportAbuseModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
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
    reason.trim().length > 0 &&
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
      alignItems="center"
    >
      <Typography variant="h4" mb={2}>
        Report Abuse
      </Typography>
      {isIdleOrLoading && (
        <Typography variant={isMobile ? 'body2' : 'body1'} textAlign="center">
          Notice something inappropriate or incorrect? Let us know if this task
          contains harmful, offensive, or misleading content. Your report will
          be reviewed confidentially.
        </Typography>
      )}
      {isPending && <CircularProgress size={40} sx={{ mx: 'auto', my: 7 }} />}
      {isError && <ErrorState error={error} />}
      {isSuccess && <SuccessState />}
      <TextField
        fullWidth
        multiline
        rows={3}
        label="Reason"
        value={reason}
        sx={{
          display: isIdle ? 'flex' : 'none',
          my: { xs: 4, md: 5 },
        }}
        onChange={(e) => {
          setReason(e.target.value);
        }}
      />
      <Box display="flex" gap={2} width="100%">
        <Button
          fullWidth
          onClick={close}
          variant="outlined"
          disabled={isPending}
        >
          {isIdleOrLoading ? 'Cancel' : 'Close'}
        </Button>
        <Button
          fullWidth
          onClick={handleReportAbuse}
          variant="contained"
          disabled={!reason.trim() || isPending}
          sx={{ display: isIdleOrLoading ? 'flex' : 'none' }}
        >
          {isMobile ? 'Report' : 'Report Abuse'}
        </Button>
      </Box>
    </Stack>
  );
}
