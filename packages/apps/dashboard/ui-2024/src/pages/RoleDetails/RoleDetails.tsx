import PageWrapper from '@components/PageWrapper';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { colorPalette } from '@assets/styles/color-palette';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ReputationOracleIcon from '@assets/icons/reputation-oracle.svg';
import ExchangeOracleIcon from '@assets/icons/exchange-oracle.svg';
import HumanAppIcon from '@assets//icons/human-app.svg';
import JobLauncherIcon from '@assets//icons/job-launcher.svg';
import RecordingOracleIcon from '@assets//icons/recording-oracle.svg';
import WalletIcon from '@assets/icons/shadowed/wallet.svg';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ShadowIcon from '@components/ShadowIcon';
import Clipboard from '@components/clipboard';

//TEMPORARY INTERFACE AND DATA
interface Overview {
	network: string;
	reputation: 'high' | 'medium' | 'low' | 'comingSoon';
	jobsLaunched: number;
}

interface StakeInfo {
	tokensStaked: number;
	tokensAllocated: number;
	tokensLocked: number;
	jobsLaunched: number | null;
}

interface RoleDetails {
	token: string;
	overview: Overview;
	stakeInfo: StakeInfo;
}
//TEMPORARY INTERFACE AND DATA
const HARDCODED_ROLE_DETAILS: RoleDetails = {
	token: '0x67499f129433b82e5a4e412143a395e032e76c0dc0f83606031',
	overview: {
		network: 'Polygon Mumbai',
		reputation: 'medium',
		jobsLaunched: 1786573,
	},
	stakeInfo: {
		tokensStaked: 257680404,
		tokensAllocated: 207704,
		tokensLocked: 40404,
		jobsLaunched: null,
	},
};

interface RoleInfoProps {
	title: string;
	points: string[];
}

const RoleInformation = ({ title, points }: RoleInfoProps) => {
	return (
		<Box>
			<Typography>{title}</Typography>
			<ul
				style={{
					margin: 0,
					marginTop: 6,
					paddingLeft: 25,
				}}
			>
				{points.map((elem) => (
					<li>{elem}</li>
				))}
			</ul>
		</Box>
	);
};

const RenderRoleDetailsInfo = ({
	role,
}: {
	role: 'exchangeOracle' | 'recordingOracle' | 'reputationOracle';
}) => {
	const roleDetailsInfo = {
		reputationOracle: {
			title: 'Reputation Oracle',
			points: [
				'The Reputation Oracle is the trust engine of HUMAN Protocol.',
				'It cross-checks validated solutions from the Recording Oracle, adjusts reputation scores, and manages payments.',
				"It's the final seal of quality and trust within the ecosystem.",
			],
		},
		recordingOracle: {
			title: 'Recording Oracle',
			points: [
				'The Recording Oracle is where task solutions get the green light.',
				'It is storing, and recording task solutions on the blockchain.',
				"From quality checks to reputation adjustments, it's the assurance you need for dependable results.",
			],
		},
		exchangeOracle: {
			title: 'Exchange Oracle',
			points: [
				"The Exchange Oracle is the HUMAN Protocol's powerhouse, directing tasks to skilled workers and ensuring smooth communication.",
				'It validates solutions, provides job updates, and handles cancellations, streamlining the job lifecycle.',
			],
		},
	};

	const details = roleDetailsInfo[role];

	if (!details) {
		return null;
	}

	return <RoleInformation points={details.points} title={details.title} />;
};

const renderReputationTitle = (
	reputation: 'high' | 'medium' | 'low' | 'comingSoon'
) => {
	const reputationAttributes = {
		high: {
			title: 'High',
			colors: {
				title: colorPalette.success.main,
				border: colorPalette.success.light,
			},
		},
		medium: {
			title: 'Medium',
			colors: {
				title: colorPalette.warning.main,
				border: colorPalette.warning.light,
			},
		},
		low: {
			title: 'Low',
			colors: {
				title: colorPalette.orange.main,
				border: colorPalette.orange.light,
			},
		},
		comingSoon: {
			title: 'Coming soon',
			colors: {
				title: colorPalette.ocean.main,
				border: colorPalette.ocean.light,
			},
		},
	};

	const colors = reputationAttributes[reputation].colors;

	return (
		<Box
			sx={{
				paddingX: 2,
				paddingY: 1,
				borderRadius: 4,
				border: `1px solid ${colors.border}`,
			}}
		>
			<Typography color={colors.title}>
				{reputationAttributes[reputation].title}
			</Typography>
		</Box>
	);
};

const renderRoleIcon = (
	role:
		| 'reputationOracle'
		| 'exchangeOracle'
		| 'humanApp'
		| 'jobLauncher'
		| 'recordingOracle'
) => {
	const roleIcons = {
		reputationOracle: <ReputationOracleIcon />,
		exchangeOracle: <ExchangeOracleIcon />,
		humanApp: <HumanAppIcon />,
		jobLauncher: <JobLauncherIcon />,
		recordingOracle: <RecordingOracleIcon />,
	};

	return roleIcons[role];
};

const RoleDetails = () => {
	return (
		<PageWrapper>
			<Stack
				sx={{ marginBottom: 4 }}
				direction={{ xs: 'column', md: 'row' }}
				gap={3}
				alignItems={{ xs: 'stretch', md: 'center' }}
			>
				<ShadowIcon img={WalletIcon} title="Wallet Adress" />
				<Clipboard value={HARDCODED_ROLE_DETAILS.token} />
			</Stack>

			<Card
				sx={{
					paddingX: { xs: 2, md: 8 },
					paddingY: { xs: 4, md: 6 },
					marginBottom: 4,
				}}
			>
				<Box
					sx={{
						marginBottom: { xs: 4, md: 8 },
					}}
				>
					<Typography
						sx={{
							marginBottom: 1.5,
						}}
						variant="h5"
					>
						Overview
					</Typography>
					<Box
						sx={{
							borderRadius: 16,
							backgroundColor: colorPalette.overlay.light,
							display: 'inline-block',
							paddingY: 1,
							paddingX: 1.5,
						}}
					>
						<Typography color={colorPalette.ocean.main}>
							HUMAN Protocol core architecture
						</Typography>
					</Box>
				</Box>
				<Stack gap={4}>
					<Stack
						gap={{ xs: 1, md: 0 }}
						alignItems="baseline"
						direction={{ sm: 'column', md: 'row' }}
					>
						<Stack
							sx={{
								width: 300,
							}}
							direction="row"
							alignItems="center"
						>
							<Tooltip title="Same">
								<IconButton sx={{ padding: 0, paddingRight: 1 }}>
									<HelpOutlineIcon fontSize="small" />
								</IconButton>
							</Tooltip>
							<Typography fontWeight={600}>Role</Typography>
						</Stack>
						<Stack gap={2} direction="column">
							{renderRoleIcon('exchangeOracle')}
							<RenderRoleDetailsInfo role="exchangeOracle" />
						</Stack>
					</Stack>
					<Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
						<Typography
							sx={{
								width: 300,
							}}
							fontWeight={600}
						>
							Network
						</Typography>
						<Typography>{HARDCODED_ROLE_DETAILS.overview.network}</Typography>
					</Stack>
					<Stack
						alignItems={{ xs: 'start', md: 'center' }}
						gap={{ xs: 1, md: 0 }}
						direction={{ sm: 'column', md: 'row' }}
					>
						<Stack
							sx={{
								width: 300,
							}}
							direction="row"
							alignItems="center"
						>
							<Tooltip title="Same">
								<IconButton sx={{ padding: 0, paddingRight: 1 }}>
									<HelpOutlineIcon fontSize="small" />
								</IconButton>
							</Tooltip>
							<Typography fontWeight={600}>Reputation Score</Typography>
						</Stack>
						{renderReputationTitle(HARDCODED_ROLE_DETAILS.overview.reputation)}
					</Stack>
					<Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
						<Typography
							sx={{
								width: 300,
							}}
							fontWeight={600}
						>
							Jobs Launched
						</Typography>
						<Typography>
							{HARDCODED_ROLE_DETAILS.overview.jobsLaunched.toLocaleString(
								'en-US'
							)}
						</Typography>
					</Stack>
				</Stack>
			</Card>

			<Card
				sx={{
					paddingX: { xs: 2, md: 8 },
					paddingY: { xs: 4, md: 6 },
					marginBottom: 4,
				}}
			>
				<Box
					sx={{
						marginBottom: { xs: 4, md: 8 },
					}}
				>
					<Typography
						sx={{
							marginBottom: 1.5,
						}}
						variant="h5"
					>
						Stake Info
					</Typography>
				</Box>
				<Stack gap={4}>
					<Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
						<Typography
							sx={{
								width: 300,
							}}
							fontWeight={600}
						>
							Tokens Staked
						</Typography>
						{HARDCODED_ROLE_DETAILS.stakeInfo.tokensStaked ? (
							<Typography>
								{HARDCODED_ROLE_DETAILS.stakeInfo.tokensStaked.toLocaleString(
									'en-US'
								)}
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
					</Stack>
					<Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
						<Typography
							sx={{
								width: 300,
							}}
							fontWeight={600}
						>
							Tokens Allocated
						</Typography>
						{HARDCODED_ROLE_DETAILS.stakeInfo.tokensAllocated ? (
							<Typography>
								{HARDCODED_ROLE_DETAILS.stakeInfo.tokensAllocated.toLocaleString(
									'en-US'
								)}
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
					</Stack>
					<Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
						<Typography
							sx={{
								width: 300,
							}}
							fontWeight={600}
						>
							Tokens Locked
						</Typography>
						{HARDCODED_ROLE_DETAILS.stakeInfo.tokensLocked ? (
							<Typography>
								{HARDCODED_ROLE_DETAILS.stakeInfo.tokensLocked.toLocaleString(
									'en-US'
								)}
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
					</Stack>
					<Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
						<Typography
							sx={{
								width: 300,
							}}
							fontWeight={600}
						>
							Jobs Launched
						</Typography>
						{HARDCODED_ROLE_DETAILS.stakeInfo.jobsLaunched ? (
							<Typography>
								{HARDCODED_ROLE_DETAILS.stakeInfo.jobsLaunched.toLocaleString(
									'en-US'
								)}
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
					</Stack>
				</Stack>
			</Card>

			<Card
				sx={{
					paddingX: { xs: 2, md: 8 },
					paddingY: { xs: 4, md: 6 },
					marginBottom: 4,
				}}
			>
				<Box>
					<Typography
						sx={{
							marginBottom: 1.5,
						}}
						variant="h5"
					>
						Escrows
					</Typography>
					<Typography
						variant="h6"
						component="p"
						textAlign={{ xs: 'left', md: 'center' }}
					>
						No escrows launched yet
					</Typography>
				</Box>
			</Card>
		</PageWrapper>
	);
};
export default RoleDetails;
