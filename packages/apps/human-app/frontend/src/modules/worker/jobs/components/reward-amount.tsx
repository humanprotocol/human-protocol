import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

export function RewardAmount({
  reward_amount,
  reward_token,
  color,
}: {
  reward_amount?: string;
  reward_token?: string;
  color?: string;
}) {
  if (!(reward_amount !== undefined && reward_token)) {
    return '';
  }
  const parsedReward = Number(reward_amount);
  const isNumeric = Number.isFinite(parsedReward);
  if (!isNumeric) {
    return (
      <Typography variant="body2" sx={{ color }}>
        {`${reward_amount} ${reward_token}`}
      </Typography>
    );
  }
  const hasDecimals = parsedReward - Math.floor(parsedReward) !== 0;
  if (hasDecimals) {
    return (
      <Tooltip title={`${reward_amount} ${reward_token}`}>
        <Typography variant="body2" sx={{ color }}>
          {`${parsedReward.toFixed(2)} ${reward_token}`}
        </Typography>
      </Tooltip>
    );
  }
  return (
    <Typography variant="body2" sx={{ color }}>
      {`${reward_amount} ${reward_token}`}
    </Typography>
  );
}
