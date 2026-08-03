import { Tooltip, Typography } from '@mui/material';

import { useIsMobile } from '@/shared/hooks/use-is-mobile';

export function RewardAmount({
  reward_amount,
  reward_token,
  color,
}: {
  reward_amount?: string;
  reward_token?: string;
  color?: string;
}) {
  const isMobile = useIsMobile();
  const variant = isMobile ? 'body2' : 'body1';

  if (!(reward_amount !== undefined && reward_token)) {
    return '';
  }

  const parsedReward = Number(reward_amount);
  const isNumeric = Number.isFinite(parsedReward);

  if (!isNumeric) {
    return (
      <Typography variant={variant} sx={{ color, fontWeight: 500 }}>
        {`${reward_amount} ${reward_token}`}
      </Typography>
    );
  }

  const hasDecimals = parsedReward - Math.floor(parsedReward) !== 0;
  if (hasDecimals) {
    return (
      <Tooltip title={`${reward_amount} ${reward_token}`}>
        <Typography variant={variant} sx={{ color, fontWeight: 500 }}>
          {`${parsedReward.toFixed(2)} ${reward_token}`}
        </Typography>
      </Tooltip>
    );
  }

  return (
    <Typography variant={variant} sx={{ color, fontWeight: 500 }}>
      {`${reward_amount} ${reward_token}`}
    </Typography>
  );
}
