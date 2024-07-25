import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import TitleSectionWrapper from '@components/SearchResults';
import { colorPalette } from '@assets/styles/color-palette';
import { AddressDetailsWallet } from '@services/api/use-address-details';
import { useHMTPrice } from '@services/api/use-hmt-price';
import { WalletAddressTransactionsTable } from '@pages/SearchResults/WalletAddress/WalletAddressTransactions/WalletAddressTransactionsTable';
import { useWalletSearch } from '@utils/hooks/use-wallet-search';

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
			<Typography>
				<>{hmtPrice.hmtPrice}</>
				<Typography
					sx={{
						marginLeft: 0.5,
					}}
					color={colorPalette.fog.main}
					component="span"
				>
					HMT
				</Typography>
			</Typography>
		</TitleSectionWrapper>
	);
};

const WalletAddress = ({
	data: { balance },
}: {
	data: AddressDetailsWallet;
}) => {
	const { filterParams } = useWalletSearch();

	return (
		<>
			<Card
				sx={{
					paddingX: { xs: 2, md: 8 },
					paddingY: { xs: 4, md: 6 },
					marginBottom: 4,
				}}
			>
				<Stack gap={4}>
					<TitleSectionWrapper title="Balance">
						<Typography>
							{balance}
							<Typography
								sx={{
									marginLeft: 0.5,
								}}
								color={colorPalette.fog.main}
								component="span"
							>
								HMT
							</Typography>
						</Typography>
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
