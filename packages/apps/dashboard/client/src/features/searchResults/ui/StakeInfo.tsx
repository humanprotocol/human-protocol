import { FC } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import SectionWrapper from '@/shared/ui/SectionWrapper';

import TokenAmount from './TokenAmount';

type Props = {
  amountStaked?: number | null;
  amountLocked?: number | null;
  amountWithdrawable?: number | null;
};

const StakeInfo: FC<Props> = ({
  amountStaked,
  amountLocked,
  amountWithdrawable,
}) => {
  if (!amountStaked && !amountLocked && !amountWithdrawable) return null;

  return (
    <SectionWrapper>
      <Typography variant="h5" mb={4}>
        Stake Info
      </Typography>
      <Stack gap={4}>
        {Number.isFinite(amountStaked) && (
          <Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
            <Typography variant="subtitle2" width={300}>
              Staked Tokens
            </Typography>
            <TokenAmount amount={amountStaked} />
          </Stack>
        )}
        {Number.isFinite(amountLocked) && (
          <Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
            <Typography variant="subtitle2" width={300}>
              Locked Tokens
            </Typography>
            <TokenAmount amount={amountLocked} />
          </Stack>
        )}
        {Number.isFinite(amountWithdrawable) && (
          <Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
            <Typography variant="subtitle2" width={300}>
              Withdrawable Tokens
            </Typography>
            <TokenAmount amount={amountWithdrawable} />
          </Stack>
        )}
      </Stack>
    </SectionWrapper>
  );
};

export default StakeInfo;
