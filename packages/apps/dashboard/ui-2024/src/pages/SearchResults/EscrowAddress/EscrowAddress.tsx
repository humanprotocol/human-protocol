import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { colorPalette } from '@assets/styles/color-palette';
import TitleSectionWrapper from '@components/SearchResults';
import { AddressDetailsEscrowSchema } from '@services/api/use-address-details';

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
			}}
		>
			<Stack gap={4}>
				<TitleSectionWrapper title="Token">
					<Typography>{token}</Typography>
				</TitleSectionWrapper>
				<TitleSectionWrapper
					tooltip={{ description: 'Amount of HMT in Escrow' }}
					title="Balance"
				>
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
				<TitleSectionWrapper
					title="Factory Address"
					tooltip={{ description: 'Address of EscrowFactory contract' }}
				>
					<Typography>{factoryAddress}</Typography>
				</TitleSectionWrapper>
				<TitleSectionWrapper title="Total Funded Amount">
					<Typography>
						{totalFundedAmount}
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
				<TitleSectionWrapper title="Paid Amount">
					<Typography>
						{amountPaid}
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

				<TitleSectionWrapper title="Status">
					<Box
						sx={{
							paddingX: 2,
							paddingY: 1,
							borderRadius: 4,
							border: `1px solid ${colorPalette.secondary.light}`,
						}}
					>
						<Typography color={colorPalette.secondary.main}>
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
					<Typography sx={{ wordBreak: 'break-word' }}>{launcher}</Typography>
				</TitleSectionWrapper>

				<TitleSectionWrapper
					title="Exchange Oracle"
					tooltip={{
						description:
							"The Exchange Oracle is HUMAN Protocol's powerhouse, routing tasks to skilled workers ensuring smooth communication.",
					}}
				>
					<Typography>{exchangeOracle}</Typography>
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
					<Typography>{recordingOracle}</Typography>
				</TitleSectionWrapper>

				<TitleSectionWrapper
					title="Reputation Oracle"
					tooltip={{
						description:
							'The Reputation Oracle is the trust engine of the HUMAN Protocol. It cross-checks validated solutions from the Recording Oracle, adjusts reputation scores, and manages payments.\n' +
							"It's the final seal of quality and trust within the ecosystem.",
					}}
				>
					<Typography>{reputationOracle}</Typography>
				</TitleSectionWrapper>
			</Stack>
		</Card>
	);
};

export default EscrowAddress;
