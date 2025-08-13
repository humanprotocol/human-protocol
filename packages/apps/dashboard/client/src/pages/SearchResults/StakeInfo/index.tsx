import { FC } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { NumericFormat } from 'react-number-format';

import SectionWrapper from '@/components/SectionWrapper';
import { useIsMobile } from '@/utils/hooks/use-breakpoints';

type Props = {
  stakedAmount?: number | null;
  lockedAmount?: number | null;
  withdrawableAmount?: number | null;
};

const renderAmount = (amount: number | null | undefined, isMobile: boolean) => {
  return (
    <Stack direction="row" whiteSpace="nowrap">
      <Typography variant="body2">
        <NumericFormat
          displayType="text"
          value={(amount || 0) * 1e18}
          thousandSeparator=","
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
  stakedAmount,
  lockedAmount,
  withdrawableAmount,
}) => {
  const isMobile = useIsMobile();
  if (!stakedAmount && !lockedAmount && !withdrawableAmount) return null;

  return (
    <SectionWrapper>
      <Typography variant="h5" mb={4}>
        Stake Info
      </Typography>
      <Stack gap={4}>
        {Number.isFinite(stakedAmount) && (
          <Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
            <Typography variant="subtitle2" width={300}>
              Staked Tokens
            </Typography>
            {renderAmount(stakedAmount, isMobile)}
          </Stack>
        )}
        {Number.isFinite(lockedAmount) && (
          <Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
            <Typography variant="subtitle2" width={300}>
              Locked Tokens
            </Typography>
            {renderAmount(lockedAmount, isMobile)}
          </Stack>
        )}
        {Number.isFinite(withdrawableAmount) && (
          <Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
            <Typography variant="subtitle2" width={300}>
              Withdrawable Tokens
            </Typography>
            {renderAmount(withdrawableAmount, isMobile)}
          </Stack>
        )}
      </Stack>
    </SectionWrapper>
  );
};

export default StakeInfo;
