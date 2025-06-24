import { FC } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useIsMobile } from '@/shared/hooks/useBreakpoints';
import FormattedNumber from '@/shared/ui/FormattedNumber';
import SectionWrapper from '@/shared/ui/SectionWrapper';

type Props = {
  amountStaked?: number | null;
  amountLocked?: number | null;
  amountWithdrawable?: number | null;
};

const renderAmount = (amount: number | null | undefined, isMobile: boolean) => {
  return (
    <Stack direction="row" whiteSpace="nowrap">
      <Typography variant="body2">
        <FormattedNumber
          value={(amount || 0) * 1e18}
          decimalScale={isMobile ? 4 : 9}
        />
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        component="span"
        ml={0.5}
      >
        HMT
      </Typography>
    </Stack>
  );
};

const StakeInfo: FC<Props> = ({
  amountStaked,
  amountLocked,
  amountWithdrawable,
}) => {
  const isMobile = useIsMobile();
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
            {renderAmount(amountStaked, isMobile)}
          </Stack>
        )}
        {Number.isFinite(amountLocked) && (
          <Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
            <Typography variant="subtitle2" width={300}>
              Locked Tokens
            </Typography>
            {renderAmount(amountLocked, isMobile)}
          </Stack>
        )}
        {Number.isFinite(amountWithdrawable) && (
          <Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
            <Typography variant="subtitle2" width={300}>
              Withdrawable Tokens
            </Typography>
            {renderAmount(amountWithdrawable, isMobile)}
          </Stack>
        )}
      </Stack>
    </SectionWrapper>
  );
};

export default StakeInfo;
