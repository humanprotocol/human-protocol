/* eslint-disable camelcase -- ...*/
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

export function RewardAmount({
  reward_amount,
  reward_token,
  color,
}: {
  reward_amount?: number;
  reward_token?: string;
  color?: string;
}) {
  if (!(reward_amount !== undefined && reward_token)) {
    return '';
  }
  const hasDecimals = reward_amount - Math.floor(reward_amount) !== 0;
  if (hasDecimals) {
    return (
      <Tooltip title={`${reward_amount} ${reward_token}`}>
        <Typography color={color} variant="body2">
          {`${reward_amount.toFixed(2)} ${reward_token}`}
        </Typography>
      </Tooltip>
    );
  }
  return `${reward_amount} ${reward_token}`;
}
