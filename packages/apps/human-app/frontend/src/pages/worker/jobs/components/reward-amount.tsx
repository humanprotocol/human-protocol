/* eslint-disable camelcase -- ...*/
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
  const hasDecimals =
    Number(reward_amount) - Math.floor(Number(reward_amount)) !== 0;
  if (hasDecimals) {
    return (
      <Tooltip title={`${reward_amount} ${reward_token}`}>
        <Typography color={color} variant="body2">
          {`${Number(reward_amount).toFixed(2)} ${reward_token}`}
        </Typography>
      </Tooltip>
    );
  }
  return (
    <Typography color={color} variant="body2">
      {`${reward_amount} ${reward_token}`}
    </Typography>
  );
}
