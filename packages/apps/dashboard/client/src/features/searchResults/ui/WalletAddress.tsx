import { FC } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { NumericFormat } from 'react-number-format';

import {
  AddressDetailsOperator,
  AddressDetailsWallet,
} from '@/features/searchResults/model/addressDetailsSchema';
import HmtBalance from '@/features/searchResults/ui/HmtBalance';
import HmtPrice from '@/features/searchResults/ui/HmtPrice';
import KVStore from '@/features/searchResults/ui/KvStore';
import ReputationScore from '@/features/searchResults/ui/ReputationScore';
import StakeInfo from '@/features/searchResults/ui/StakeInfo';
import TitleSectionWrapper from '@/features/searchResults/ui/TitleSectionWrapper';
import { useIsMobile } from '@/shared/hooks/useBreakpoints';
import SectionWrapper from '@/shared/ui/SectionWrapper';

type Props = {
  data: AddressDetailsWallet | AddressDetailsOperator;
};

const WalletAddress: FC<Props> = ({ data }) => {
  const {
    balance,
    amountStaked,
    amountLocked,
    reputation,
    amountWithdrawable,
  } = data;
  const isMobile = useIsMobile();
  const isWallet = 'totalHMTAmountReceived' in data;

  return (
    <>
      <SectionWrapper>
        <Stack gap={4}>
          <Typography variant="h5">Overview</Typography>
          <TitleSectionWrapper title="Balance">
            <HmtBalance balance={balance} />
          </TitleSectionWrapper>
          <TitleSectionWrapper title="HMT Price">
            <HmtPrice />
          </TitleSectionWrapper>
          <TitleSectionWrapper
            title="Reputation Score"
            tooltip="Reputation of the role as per their activities"
          >
            <ReputationScore reputation={reputation} />
          </TitleSectionWrapper>
          {isWallet && (
            <TitleSectionWrapper
              title="Earned Payouts"
              tooltip="Total amount earned by participating in jobs"
            >
              <Typography variant="body2">
                <NumericFormat
                  displayType="text"
                  value={(data?.totalHMTAmountReceived || 0) * 1e18}
                  thousandSeparator=","
                  decimalScale={isMobile ? 4 : 9}
                />
              </Typography>
              <Typography
                component="span"
                variant="body2"
                ml={0.5}
                color="text.secondary"
              >
                HMT
              </Typography>
            </TitleSectionWrapper>
          )}
        </Stack>
      </SectionWrapper>
      <StakeInfo
        amountStaked={amountStaked}
        amountLocked={amountLocked}
        amountWithdrawable={amountWithdrawable}
      />
      <KVStore />
    </>
  );
};

export default WalletAddress;
