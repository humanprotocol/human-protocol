import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { colorPalette } from '@assets/styles/color-palette';
import TitleSectionWrapper from '@components/SearchResults';
import { AddressDetailsEscrowSchema } from '@services/api/use-address-details';
import { HMTBalance } from '@pages/SearchResults/EscrowAddress/HMTBalance';

const EscrowAddress = ({
	data: {
		token,
		balance,
		factoryAddress,
		totalFundedAmount,
		amountPaid,
		status,
		launcher,
		exchangeOracle,
		recordingOracle,
		reputationOracle,
	},
}: {
	data: AddressDetailsEscrowSchema;
}) => {
	return (
		<Card
			sx={{
				paddingX: { xs: 2, md: 8 },
				paddingY: { xs: 4, md: 6 },
				borderRadius: '16px',
				boxShadow: 'none',
			}}
		>
			<Stack gap={4}>
				<TitleSectionWrapper title="Token">
					<Typography variant="body2">{token}</Typography>
				</TitleSectionWrapper>
				{balance !== undefined && balance !== null ? (
					<TitleSectionWrapper
						tooltip={{ description: 'Amount of HMT in Escrow' }}
						title="Balance"
					>
						<HMTBalance HMTBalance={balance} />
					</TitleSectionWrapper>
				) : null}
				<TitleSectionWrapper
					title="Factory Address"
					tooltip={{ description: 'Address of EscrowFactory contract' }}
				>
					<Typography variant="body2">{factoryAddress}</Typography>
				</TitleSectionWrapper>
				<TitleSectionWrapper title="Total Funded Amount">
					<Stack sx={{ whiteSpace: 'nowrap', flexDirection: 'row' }}>
						<Typography variant="body2">{totalFundedAmount}</Typography>
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
				<TitleSectionWrapper title="Paid Amount">
					<Stack sx={{ whiteSpace: 'nowrap', flexDirection: 'row' }}>
						<Typography variant="body2">{amountPaid}</Typography>
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

				<TitleSectionWrapper title="Status">
					<Box
						sx={{
							padding: '3px 8px',
							borderRadius: '16px',
							border: `1px solid ${colorPalette.secondary.light}`,
						}}
					>
						<Typography
							variant="Components/Chip"
							color={colorPalette.secondary.main}
						>
							{status}
						</Typography>
					</Box>
				</TitleSectionWrapper>

				<TitleSectionWrapper
					title="Job Launcher"
					tooltip={{
						description: 'Address of the Job Launcher that created the escrow',
					}}
				>
					<Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
						{launcher}
					</Typography>
				</TitleSectionWrapper>

				<TitleSectionWrapper
					title="Exchange Oracle"
					tooltip={{
						description:
							"The Exchange Oracle is HUMAN Protocol's powerhouse, routing tasks to skilled workers ensuring smooth communication.",
					}}
				>
					<Typography variant="body2">{exchangeOracle}</Typography>
				</TitleSectionWrapper>

				<TitleSectionWrapper
					title="Recording Oracle"
					tooltip={{
						description:
							'The Recording Oracle is where task solutions get the green light. It is storing, and recording task solutions on the blockchain.\n' +
							'\n' +
							"From quality checks to reputation adjustments, it's the assurance you need for dependable results.",
					}}
				>
					<Typography variant="body2">{recordingOracle}</Typography>
				</TitleSectionWrapper>

				<TitleSectionWrapper
					title="Reputation Oracle"
					tooltip={{
						description:
							'The Reputation Oracle is the trust engine of the HUMAN Protocol. It cross-checks validated solutions from the Recording Oracle, adjusts reputation scores, and manages payments.\n' +
							"It's the final seal of quality and trust within the ecosystem.",
					}}
				>
					<Typography variant="body2">{reputationOracle}</Typography>
				</TitleSectionWrapper>
			</Stack>
		</Card>
	);
};

export default EscrowAddress;
