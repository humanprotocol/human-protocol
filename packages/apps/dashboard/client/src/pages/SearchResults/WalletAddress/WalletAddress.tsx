import { FC } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

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

type Props = {
  data: AddressDetailsWallet | AddressDetailsOperator;
};

const WalletAddress: FC<Props> = ({ data }) => {
  const { balance, amountStaked, amountLocked, reputation } = data;
  const isWallet = 'totalAmountReceived' in data;

  return (
    <>
      <SectionWrapper>
        <Stack gap={4}>
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
              title="Received Payouts"
              tooltip="Received payouts from the operator"
            >
              <Typography variant="body2">
                {data?.totalAmountReceived}
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
      <StakeInfo amountStaked={amountStaked} amountLocked={amountLocked} />
      <KVStore />
    </>
  );
};

export default WalletAddress;
