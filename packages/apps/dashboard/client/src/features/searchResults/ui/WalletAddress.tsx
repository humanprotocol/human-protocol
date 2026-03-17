import type { FC } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import SectionWrapper from '@/shared/ui/SectionWrapper';

import type {
  AddressDetailsOperator,
  AddressDetailsWallet,
} from '../model/addressDetailsSchema';

import HmtBalance from './HmtBalance';
import HmtPrice from './HmtPrice';
import KVStore from './KvStore';
import ReputationScore from './ReputationScore';
import StakeInfo from './StakeInfo';
import TitleSectionWrapper from './TitleSectionWrapper';
import TokenAmount from './TokenAmount';

type Props = {
  data: AddressDetailsWallet | AddressDetailsOperator;
};

const WalletAddress: FC<Props> = ({ data }) => {
  const {
    balance,
    stakedAmount,
    lockedAmount,
    reputation,
    withdrawableAmount,
  } = data;
  const isWallet = 'payoutCount' in data;

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
              title="Payouts received"
              tooltip="Total count of payouts received by participating in jobs"
            >
              <TokenAmount amount={data?.payoutCount} />
            </TitleSectionWrapper>
          )}
        </Stack>
      </SectionWrapper>
      <StakeInfo
        stakedAmount={stakedAmount}
        lockedAmount={lockedAmount}
        withdrawableAmount={withdrawableAmount}
      />
      <KVStore />
    </>
  );
};

export default WalletAddress;
