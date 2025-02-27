import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import TitleSectionWrapper from '@components/SearchResults';
import { colorPalette } from '@assets/styles/color-palette';
import { AddressDetailsWallet } from '@services/api/use-address-details';
import { useHMTPrice } from '@services/api/use-hmt-price';
import { WalletAddressTransactionsTable } from '@pages/SearchResults/WalletAddress/WalletAddressTransactions/WalletAddressTransactionsTable';
import { useWalletSearch } from '@utils/hooks/use-wallet-search';
import { NumericFormat } from 'react-number-format';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';

const HmtPrice = () => {
  const {
    data: hmtPrice,
    isError: isHmtPriceError,
    isPending: isHmtPricePending,
  } = useHMTPrice();

  if (isHmtPriceError) {
    return <TitleSectionWrapper title="HMT Price">N/A</TitleSectionWrapper>;
  }

  if (isHmtPricePending) {
    return <TitleSectionWrapper title="HMT Price">...</TitleSectionWrapper>;
  }

  return (
    <TitleSectionWrapper title="HMT Price">
      <Stack sx={{ whiteSpace: 'nowrap', flexDirection: 'row' }}>
        <Typography variant="body2">
          <>{hmtPrice.hmtPrice}</>
        </Typography>
        <Typography
          sx={{
            marginLeft: 0.5,
          }}
          color={colorPalette.fog.main}
          component="span"
          variant="body2"
        >
          $
        </Typography>
      </Stack>
    </TitleSectionWrapper>
  );
};

const WalletAddress = ({
  data: { balance },
}: {
  data: AddressDetailsWallet;
}) => {
  const { filterParams } = useWalletSearch();
  const { mobile } = useBreakPoints();

  return (
    <>
      <Card
        sx={{
          paddingX: { xs: 2, md: 8 },
          paddingY: { xs: 4, md: 6 },
          marginBottom: 4,
          borderRadius: '16px',
          boxShadow: 'none',
        }}
      >
        <Stack gap={4}>
          <TitleSectionWrapper title="Balance">
            <Stack sx={{ whiteSpace: 'nowrap', flexDirection: 'row' }}>
              <Typography variant="body2">
                <NumericFormat
                  displayType="text"
                  value={Number(balance) < 1 ? Number(balance) * 1e18 : balance}
                  thousandSeparator=","
                  decimalScale={mobile.isMobile ? 4 : undefined}
                />
              </Typography>
              <Typography
                sx={{
                  marginLeft: 0.5,
                }}
                color={colorPalette.fog.main}
                component="span"
                variant="body2"
              >
                HMT
              </Typography>
            </Stack>
          </TitleSectionWrapper>
          <HmtPrice />
        </Stack>
      </Card>

      {filterParams.address && filterParams.chainId ? (
        <WalletAddressTransactionsTable />
      ) : null}
    </>
  );
};

export default WalletAddress;
