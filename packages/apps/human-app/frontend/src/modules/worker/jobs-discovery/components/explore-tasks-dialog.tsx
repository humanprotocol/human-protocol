import { useTranslation } from 'react-i18next';
import { Stack, Typography } from '@mui/material';

import { ResponsiveOverlay } from '@/shared/components/ui/responsive-overlay';
import { Oracle } from '../../services/oracles.service';
import { useColorMode } from '@/shared/contexts/color-mode';
import { shortenEscrowAddress } from '@/shared/helpers/evm';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { AvailableJobsTableDesktop } from '../../jobs/available-jobs/components/desktop';
import { AvailableJobsListMobile } from '../../jobs/available-jobs/components/mobile';

type Props = {
  open: boolean;
  onClose: () => void;
  oracle: Oracle;
};

export function ExploreTasksDialog({ open, onClose, oracle }: Props) {
  const { colorPalette } = useColorMode();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <ResponsiveOverlay
      open={open}
      onClose={onClose}
      desktopSx={{
        pt: 4,
        pb: 0,
        px: 0,
        minHeight: 600,
        maxHeight: 700,
        minWidth: '70%',
        width: 'unset',
      }}
      mobileSx={{ display: 'flex', flexDirection: 'column', pt: 2 }}
      closeButtonSx={{ zIndex: 2 }}
    >
      <Stack
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          flexShrink: 0,
          gap: { xs: 1, md: 3 },
          px: { xs: 2, md: 4 },
          pb: 3,
          bgcolor: colorPalette.background.paper,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: colorPalette.text.auxiliary100,
            fontWeight: 400,
          }}
        >
          {t('worker.jobs.jobsFor')}{' '}
          <Typography
            component="span"
            variant="h6"
            sx={{
              fontWeight: 700,
              color: colorPalette.text.primary,
            }}
          >
            {oracle.name}
          </Typography>
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: colorPalette.text.auxiliary200,
            fontWeight: 500,
          }}
        >
          {t('worker.jobs.address')}:{' '}
          <Typography
            component="span"
            variant="body1"
            sx={{ color: colorPalette.text.primary, fontWeight: 700 }}
          >
            {shortenEscrowAddress(oracle.address, 4, 4)}
          </Typography>
        </Typography>
      </Stack>
      <Stack sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {isMobile ? (
          <AvailableJobsListMobile oracleAddress={oracle.address} />
        ) : (
          <AvailableJobsTableDesktop oracleAddress={oracle.address} />
        )}
      </Stack>
    </ResponsiveOverlay>
  );
}
