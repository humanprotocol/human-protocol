import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { NumericFormat } from 'react-number-format';

import TitleSectionWrapper from '@components/SearchResults';
import SectionWrapper from '@components/SectionWrapper';

import { useHMTPrice } from '@services/api/use-hmt-price';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';
import StakeInfo from '../StakeInfo';
import KVStore from '../KVStore';

const HmtPrice = () => {
  const { data, isError, isPending } = useHMTPrice();

  if (isError) {
    return <TitleSectionWrapper title="HMT Price">N/A</TitleSectionWrapper>;
  }

  if (isPending) {
    return <TitleSectionWrapper title="HMT Price">...</TitleSectionWrapper>;
  }

  return (
    <TitleSectionWrapper title="HMT Price">
      <Stack flexDirection="row" whiteSpace="nowrap">
        <Typography variant="body2">{data}</Typography>
        <Typography
          component="span"
          variant="body2"
          color="text.secondary"
          ml={0.5}
        >
          $
        </Typography>
      </Stack>
    </TitleSectionWrapper>
  );
};

const WalletAddress = ({ balance }: { balance: number | null | undefined }) => {
  const { mobile } = useBreakPoints();

  return (
    <>
      <SectionWrapper>
        <Stack gap={4}>
          <TitleSectionWrapper title="Balance">
            <Stack direction="row" whiteSpace="nowrap">
              <Typography variant="body2">
                <NumericFormat
                  displayType="text"
                  value={Number(balance) < 1 ? Number(balance) * 1e18 : balance}
                  thousandSeparator=","
                  decimalScale={mobile.isMobile ? 4 : undefined}
                />
              </Typography>
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
                ml={0.5}
              >
                HMT
              </Typography>
            </Stack>
          </TitleSectionWrapper>
          <HmtPrice />
        </Stack>
      </SectionWrapper>
      <StakeInfo />
      <KVStore />
    </>
  );
};

export default WalletAddress;
