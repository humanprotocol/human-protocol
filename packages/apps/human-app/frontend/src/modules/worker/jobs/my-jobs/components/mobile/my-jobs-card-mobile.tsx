import { Chip, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import {
  EvmAddress,
  MyJobsTableActions,
  RewardAmount,
} from '../../../components';
import { type MyJob } from '../../../schemas';
import { useColorMode } from '@/shared/contexts/color-mode/use-color-mode';
import { JobType } from '@/modules/smart-contracts/EthKVStore/config';
import { JOB_TYPES } from '@/shared/consts';
import { TimeUntil } from '../time-until';
import { ChainIcon } from '@/shared/components/ui/chain-icon';
import {
  JobExpiryTimeIcon,
  JobStatusIcon,
  OracleAddressIcon,
  OracleRewardIcon,
} from '@/shared/components/ui/icons';

const Row = ({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => {
  const { colorPalette } = useColorMode();
  return (
    <Stack
      direction="row"
      sx={{
        width: '100%',
        alignItems: 'center',
        gap: 1,
        color: colorPalette.text.auxiliary200,
      }}
    >
      {icon}
      <Typography
        variant="body2"
        sx={{ color: colorPalette.text.auxiliary200, fontWeight: 500 }}
      >
        {label}:{' '}
      </Typography>
      {children}
    </Stack>
  );
};

export function MyJobsCardMobile({ job }: { job: MyJob }) {
  const { colorPalette } = useColorMode();
  const { t } = useTranslation();

  const jobType = JOB_TYPES.find((j) => j === job.job_type) as JobType;
  const jobTypeLabel = t(`jobTypeLabels.${jobType}`);

  const hasUrl = !!job.url;

  return (
    <Paper
      key={job.escrow_address}
      sx={{
        mb: 2.5,
        pt: 2,
        boxShadow: 'none',
        borderRadius: '20px',
        border: `1px solid ${colorPalette.border.main}`,
      }}
    >
      <Stack
        direction="row"
        sx={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: 2,
          mb: 2,
        }}
      >
        <Chip
          label={jobTypeLabel}
          sx={{
            typography: 'body2',
            fontWeight: 500,
            color: colorPalette.text.primary,
            bgcolor: colorPalette.background.subtle,
            borderRadius: '99px',
            border: `0.5px solid ${colorPalette.border.main}`,
          }}
        />
        <ChainIcon chainId={job.chain_id} />
      </Stack>
      <Stack sx={{ gap: 1, px: 2, pb: 2 }}>
        <Row
          label={t('worker.jobs.address')}
          icon={
            <OracleAddressIcon sx={{ fontSize: '20px', color: 'inherit' }} />
          }
        >
          <EvmAddress address={job.escrow_address} />
        </Row>
        <Row
          label={t('worker.jobs.expiryTime')}
          icon={
            <JobExpiryTimeIcon sx={{ fontSize: '20px', color: 'inherit' }} />
          }
        >
          <Typography
            variant="body2"
            sx={{ color: colorPalette.text.auxiliary100, fontWeight: 500 }}
          >
            <TimeUntil date={job.expires_at} />
          </Typography>
        </Row>
        <Row
          label={t('worker.jobs.status')}
          icon={<JobStatusIcon sx={{ fontSize: '20px', color: 'inherit' }} />}
        >
          <Typography
            variant="body2"
            sx={{
              color: colorPalette.text.auxiliary100,
              fontWeight: 500,
              textTransform: 'capitalize',
            }}
          >
            {job.status.toLowerCase()}
          </Typography>
        </Row>
        <Row
          label={t('worker.jobs.rewardAmount')}
          icon={
            <OracleRewardIcon sx={{ fontSize: '20px', color: 'inherit' }} />
          }
        >
          <RewardAmount
            reward_amount={job.reward_amount}
            reward_token={job.reward_token}
            color={colorPalette.primary.light}
          />
        </Row>
      </Stack>
      {hasUrl && (
        <Stack
          direction="row"
          sx={{
            alignItems: 'flex-end',
            py: 2,
            px: 2,
            gap: 1,
            width: '100%',
            borderTop: `1px solid ${colorPalette.border.main}`,
          }}
        >
          <MyJobsTableActions job={job} />
        </Stack>
      )}
    </Paper>
  );
}
