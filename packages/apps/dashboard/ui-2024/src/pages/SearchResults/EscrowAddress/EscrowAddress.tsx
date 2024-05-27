import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { colorPalette } from '@assets/styles/color-palette';
import TitleSectionWrapper from '@components/SearchResults';

const HARDCODED_ESCROW_ADDRESS = {
	token: 'HMT',
	balance: '234645753',
	factoryAddress: '412143a395e032e76c0dc0f83606031',
	totalFoundedAmount: '234638547865753',
	paidAmount: '25687',
	status: 'Launched',
	jobLauncher: '0x67499f129433b82e5a4e412143a395e032e76c0dc0f83606031',
	exchangeOracle: 'xxxxxxxxxx',
	recordingOracle: 'xxxxxxxxxx',
	reputationOracle: 'xxxxxxxxxx',
	manifest: 'xxxxxxxxxx',
	results: 'xxxxxxxxxx',
};

const EscrowAddress = () => {
	return (
		<Card
			sx={{
				paddingX: { xs: 2, md: 8 },
				paddingY: { xs: 4, md: 6 },
			}}
		>
			<Stack gap={4}>
				<TitleSectionWrapper title="Token">
					<Typography>{HARDCODED_ESCROW_ADDRESS.token ?? 'N/A'}</Typography>
				</TitleSectionWrapper>
				<TitleSectionWrapper
					tooltip={{ description: 'Amount of HMT in Escrow' }}
					title="Balance"
				>
					{HARDCODED_ESCROW_ADDRESS.balance ? (
						<Typography>
							{HARDCODED_ESCROW_ADDRESS.balance}
							<Typography
								sx={{
									marginLeft: 0.5,
								}}
								color={colorPalette.fog.main}
								component="span"
							>
								{HARDCODED_ESCROW_ADDRESS.token}
							</Typography>
						</Typography>
					) : (
						<Typography>N/A</Typography>
					)}
				</TitleSectionWrapper>
				<TitleSectionWrapper
					title="Factory Address"
					tooltip={{ description: 'Address of EscrowFactory contract' }}
				>
					<Typography>{HARDCODED_ESCROW_ADDRESS.factoryAddress}</Typography>
				</TitleSectionWrapper>
				<TitleSectionWrapper title="Total Funded Amount">
					{HARDCODED_ESCROW_ADDRESS.totalFoundedAmount ? (
						<Typography>
							{HARDCODED_ESCROW_ADDRESS.totalFoundedAmount}
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
					) : (
						<Typography>N/A</Typography>
					)}
				</TitleSectionWrapper>
				<TitleSectionWrapper title="Paid Amount">
					{HARDCODED_ESCROW_ADDRESS.paidAmount ? (
						<Typography>
							{HARDCODED_ESCROW_ADDRESS.paidAmount}
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
					) : (
						<Typography>N/A</Typography>
					)}
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
							{HARDCODED_ESCROW_ADDRESS.status}
						</Typography>
					</Box>
				</TitleSectionWrapper>

				<TitleSectionWrapper
					title="Job Launcher"
					tooltip={{
						description: 'Address of the Job Launcher that created the escrow',
					}}
				>
					<Typography sx={{ wordBreak: 'break-word' }}>
						{HARDCODED_ESCROW_ADDRESS.jobLauncher}
					</Typography>
				</TitleSectionWrapper>

				<TitleSectionWrapper
					title="Exchange Oracle"
					tooltip={{
						description:
							"The Exchange Oracle is HUMAN Protocol's powerhouse, routing tasks to skilled workers ensuring smooth communication.",
					}}
				>
					<Typography>{HARDCODED_ESCROW_ADDRESS.exchangeOracle}</Typography>
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
					<Typography>{HARDCODED_ESCROW_ADDRESS.recordingOracle}</Typography>
				</TitleSectionWrapper>

				<TitleSectionWrapper
					title="Reputation Oracle"
					tooltip={{
						description:
							'The Reputation Oracle is the trust engine of the HUMAN Protocol. It cross-checks validated solutions from the Recording Oracle, adjusts reputation scores, and manages payments.\n' +
							"It's the final seal of quality and trust within the ecosystem.",
					}}
				>
					<Typography>{HARDCODED_ESCROW_ADDRESS.reputationOracle}</Typography>
				</TitleSectionWrapper>

				<TitleSectionWrapper
					title="Manifest Oracle"
					tooltip={{
						description: 'Metadata file containing job information',
					}}
				>
					<Typography>{HARDCODED_ESCROW_ADDRESS.manifest}</Typography>
				</TitleSectionWrapper>

				<TitleSectionWrapper title="Results">
					<Typography>{HARDCODED_ESCROW_ADDRESS.results ?? 'N/A'}</Typography>
				</TitleSectionWrapper>
			</Stack>
		</Card>
	);
};

export default EscrowAddress;
