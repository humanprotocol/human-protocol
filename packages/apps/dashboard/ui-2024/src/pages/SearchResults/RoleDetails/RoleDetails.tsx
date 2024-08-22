import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { colorPalette } from '@assets/styles/color-palette';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ReputationOracleIcon from '@assets/icons/reputation-oracle.svg';
import ExchangeOracleIcon from '@assets/icons/exchange-oracle.svg';
import HumanAppIcon from '@assets/icons/human-app.svg';
import JobLauncherIcon from '@assets/icons/job-launcher.svg';
import RecordingOracleIcon from '@assets/icons/recording-oracle.svg';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { AddressDetailsLeader, Roles } from '@services/api/use-address-details';
import { getNetwork } from '@utils/config/networks';
import { useWalletSearch } from '@utils/hooks/use-wallet-search';
import { RoleDetailsEscrowsTable } from '@pages/SearchResults/RoleDetails/RoleDetailsEscrows/RoleDetailsEscrowsTable';

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
				{points.map((elem, idx) => (
					<li key={idx}>{elem}</li>
				))}
			</ul>
		</Box>
	);
};

const RenderRoleDetailsInfo = ({
	role,
}: {
	role: AddressDetailsLeader['role'];
}) => {
	const roleDetailsInfo: Partial<
		Record<Roles, { title: string; points: string[] }>
	> = {
		[Roles.reputationOracle]: {
			title: 'Reputation Oracle',
			points: [
				'The Reputation Oracle is the trust engine of HUMAN Protocol.',
				'It cross-checks validated solutions from the Recording Oracle, adjusts reputation scores, and manages payments.',
				"It's the final seal of quality and trust within the ecosystem.",
			],
		},
		[Roles.recordingOracle]: {
			title: 'Recording Oracle',
			points: [
				'The Recording Oracle is where task solutions get the green light.',
				'It is storing, and recording task solutions on the blockchain.',
				"From quality checks to reputation adjustments, it's the assurance you need for dependable results.",
			],
		},
		[Roles.exchangeOracle]: {
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

const renderReputationTitle = (reputation: number) => {
	const reputationAttributes: Record<
		string,
		{ title: string; colors: { title: string; border: string } }
	> = {
		'3': {
			title: 'High',
			colors: {
				title: colorPalette.success.main,
				border: colorPalette.success.light,
			},
		},
		'2': {
			title: 'Medium',
			colors: {
				title: colorPalette.warning.main,
				border: colorPalette.warning.light,
			},
		},

		'1': {
			title: 'Low',
			colors: {
				title: colorPalette.orange.main,
				border: colorPalette.orange.light,
			},
		},
		'0': {
			title: 'Coming soon',
			colors: {
				title: colorPalette.ocean.main,
				border: colorPalette.ocean.light,
			},
		},
	};

	const colors = reputationAttributes[reputation.toString()].colors;

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
				{reputationAttributes[reputation.toString()].title}
			</Typography>
		</Box>
	);
};

const renderRoleIcon = (role: AddressDetailsLeader['role']) => {
	const roleIcons = {
		[Roles.reputationOracle]: <ReputationOracleIcon />,
		[Roles.exchangeOracle]: <ExchangeOracleIcon />,
		[Roles.humanApp]: <HumanAppIcon />,
		[Roles.jobLauncher]: <JobLauncherIcon />,
		[Roles.recordingOracle]: <RecordingOracleIcon />,
	};

	return roleIcons[role];
};

const RoleDetails = ({
	data: {
		role,
		chainId,
		reputation,
		amountJobsProcessed,
		amountStaked,
		amountAllocated,
		amountLocked,
	},
}: {
	data: AddressDetailsLeader;
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
							<Typography fontWeight={600}>Role</Typography>
						</Stack>
						<Stack gap={2} direction="column">
							{renderRoleIcon(role)}
							<RenderRoleDetailsInfo role={role} />
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
						<Typography>{getNetwork(chainId)?.name || ''}</Typography>
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
							<Tooltip title="Reputation of the role as per their activities">
								<IconButton
									sx={{
										padding: 0,
										paddingRight: 1,
										color: colorPalette.fog.main,
									}}
								>
									<HelpOutlineIcon fontSize="small" />
								</IconButton>
							</Tooltip>
							<Typography fontWeight={600}>Reputation Score</Typography>
						</Stack>
						{renderReputationTitle(reputation)}
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
						<Typography>{amountJobsProcessed}</Typography>
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
						<Typography>
							{amountStaked}
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
					</Stack>
					{amountAllocated !== undefined ? (
						<Stack
							gap={{ xs: 1, md: 0 }}
							direction={{ sm: 'column', md: 'row' }}
						>
							<Typography
								sx={{
									width: 300,
								}}
								fontWeight={600}
							>
								Tokens Allocated
							</Typography>
							<Typography>
								{amountAllocated}
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
						</Stack>
					) : null}
					{amountLocked !== undefined ? (
						<Stack
							gap={{ xs: 1, md: 0 }}
							direction={{ sm: 'column', md: 'row' }}
						>
							<Typography
								sx={{
									width: 300,
								}}
								fontWeight={600}
							>
								Tokens Locked
							</Typography>
							<Typography>
								{amountLocked}
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
						</Stack>
					) : null}
				</Stack>
			</Card>

			{filterParams.address && filterParams.chainId ? (
				<RoleDetailsEscrowsTable role={role} />
			) : null}
		</>
	);
};
export default RoleDetails;
