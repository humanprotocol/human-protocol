import { FC } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { NumericFormat } from 'react-number-format';

import TitleSectionWrapper from '@components/SearchResults';
import SectionWrapper from '@components/SectionWrapper';
import HmtBalance from '../HmtBalance';
import HmtPrice from '../HmtPrice';
import KVStore from '../KVStore';
import ReputationScore from '../ReputationScore';
import StakeInfo from '../StakeInfo';

import {
  AddressDetailsOperator,
  AddressDetailsWallet,
} from '@services/api/use-address-details';
import { useIsMobile } from '@utils/hooks/use-breakpoints';

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
  const isWallet = 'totalAmountReceived' in data;

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
                  value={(data?.totalAmountReceived || 0) * 1e18}
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
