/* eslint-disable camelcase */
import { useState } from 'react';
import { Box, Button, Stack, Typography, TextField } from '@mui/material';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { reportAbuse } from '../services/jobs.service';

interface ReportAbuseModalProps {
  escrowAddress: string;
  chainId: number;
  close: () => void;
}

export function ReportAbuseModal({
  escrowAddress,
  chainId,
  close,
}: Readonly<ReportAbuseModalProps>) {
  const [reason, setReason] = useState('');
  const isMobile = useIsMobile();

  const handleReportAbuse = () => {
    close();
    void reportAbuse({
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
      <Typography variant={isMobile ? 'body2' : 'body1'}>
        Notice something inappropriate or incorrect? Let us know if this task
        contains harmful, offensive, or misleading content. Your report will be
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
          onClick={handleReportAbuse}
          variant="contained"
          disabled={!reason.trim()}
        >
          {isMobile ? 'Report' : 'Report Abuse'}
        </Button>
      </Box>
    </Stack>
  );
}
