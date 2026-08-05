import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Chip, Paper, Stack, Typography } from '@mui/material';

import { AvailableJob } from '../../../types';
import { JobType } from '@/modules/smart-contracts/EthKVStore/config';
import { useColorMode } from '@/shared/contexts/color-mode/use-color-mode';
import {
  OracleAddressIcon,
  OracleRewardIcon,
} from '@/shared/components/ui/icons';
import { EvmAddress, RewardAmount } from '../../../components';
import { Button } from '@/shared/components/ui/button';
import { useJobsNotifications } from '../../../hooks';
import { useAssignJobMutation } from '../../hooks';
import { BaseDrawer } from '@/shared/components/ui/base-drawer';
import { ChainIcon } from '@/shared/components/ui/chain-icon';

function DescriptionDrawer({
  open,
  onClose,
  description,
}: {
  open: boolean;
  onClose: () => void;
  description: string | undefined;
}) {
  const { t } = useTranslation();
  const { colorPalette } = useColorMode();

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      sx={{ maxHeight: '50dvh', px: 2 }}
    >
      <Typography
        variant="h6"
        sx={{ color: colorPalette.text.auxiliary100, mb: 4 }}
      >
        {t('worker.jobs.taskDescriptionTitle')}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: colorPalette.text.auxiliary100 }}
      >
        {description}
      </Typography>
    </BaseDrawer>
  );
}

export function AvailableJobsCard({ job }: { job: AvailableJob }) {
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);

  const { t } = useTranslation();
  const { colorPalette } = useColorMode();

  const { onJobAssignmentError, onJobAssignmentSuccess } =
    useJobsNotifications();

  const { mutate: assignJobMutation, isPending } = useAssignJobMutation(
    {
      onSuccess: onJobAssignmentSuccess,
      onError: onJobAssignmentError,
    },
    [`assignJob-${job.escrow_address}`]
  );

  return (
    <Paper
      key={`${job.escrow_address}-${job.chain_id}-${job.job_type}`}
      elevation={0}
      sx={{
        mb: 2.5,
        borderRadius: '20px',
        border: `1px solid ${colorPalette.border.strong}`,
      }}
    >
      <Stack sx={{ p: 2, gap: 2 }}>
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Chip
            label={t(`jobTypeLabels.${job.job_type as JobType}`)}
            sx={{
              typography: 'body2',
              fontWeight: 500,
              color: colorPalette.text.primary,
              bgcolor: colorPalette.background.subtle,
              width: 'fit-content',
              borderRadius: '99px',
              border: `0.5px solid ${colorPalette.border.strong}`,
            }}
          />
          <ChainIcon chainId={job.chain_id} />
        </Stack>
        <Stack sx={{ gap: 1 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75 }}>
            <OracleAddressIcon
              sx={{
                color: colorPalette.text.auxiliary200,
                fontSize: '20px',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: colorPalette.text.auxiliary200,
                fontWeight: 500,
              }}
            >
              {t('worker.oraclesList.address')}:
            </Typography>
            <EvmAddress address={job.escrow_address} />
          </Stack>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75 }}>
            <OracleRewardIcon
              sx={{
                color: colorPalette.text.auxiliary200,
                fontSize: '20px',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: colorPalette.text.auxiliary200,
                fontWeight: 500,
              }}
            >
              {t('worker.oraclesList.reward')}:
            </Typography>
            <RewardAmount
              reward_amount={job.reward_amount}
              reward_token={job.reward_token}
              color={colorPalette.text.auxiliary100}
            />
          </Stack>
        </Stack>
      </Stack>
      <Stack
        direction="row"
        sx={{
          p: 2,
          gap: 2,
          borderTop: `1px solid ${colorPalette.border.main}`,
        }}
      >
        {!!job.job_description && (
          <Button
            variant="outlined"
            fullWidth
            disabled={isPending}
            onClick={() => setShowDescriptionDialog(true)}
          >
            {t('worker.jobs.taskDescription')}
          </Button>
        )}
        <Button
          variant="contained"
          color="accent"
          fullWidth
          disabled={isPending}
          onClick={() =>
            assignJobMutation({
              escrow_address: job.escrow_address,
              chain_id: job.chain_id,
            })
          }
        >
          {t('worker.jobs.claimTask')}
        </Button>
      </Stack>
      <DescriptionDrawer
        open={showDescriptionDialog}
        onClose={() => setShowDescriptionDialog(false)}
        description={job.job_description}
      />
    </Paper>
  );
}
