import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { colorPalette } from '@assets/styles/color-palette';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import ReputationOracleIcon from '@assets/icons/reputation-oracle.svg';
import ExchangeOracleIcon from '@assets/icons/exchange-oracle.svg';
import JobLauncherIcon from '@assets/icons/job-launcher.svg';
import RecordingOracleIcon from '@assets/icons/recording-oracle.svg';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { AddressDetailsLeader } from '@services/api/use-address-details';
import { getNetwork } from '@utils/config/networks';
import { useWalletSearch } from '@utils/hooks/use-wallet-search';
import { RoleDetailsEscrowsTable } from '@pages/SearchResults/RoleDetails/RoleDetailsEscrows/RoleDetailsEscrowsTable';
import { Reputation } from '@services/api/use-leaderboard-details';
import { env } from '@helpers/env';
import { FormatNumberWithDecimals } from '@components/Home/FormatNumber';
import CustomTooltip from '@components/CustomTooltip';
import { Role } from '@human-protocol/sdk';

interface RoleInfoProps {
  title: string;
  points: string[];
}

const RoleInformation = ({ title, points }: RoleInfoProps) => {
  return (
    <Box>
      <Typography variant="body2">{title}</Typography>
      <ul
        style={{
          margin: 0,
          marginTop: 6,
          paddingLeft: 25,
        }}
      >
        {points.map((elem, idx) => (
          <li key={idx}>
            <Typography variant="body2">{elem}</Typography>
          </li>
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
  if (!role) {
    return null;
  }

  const roleDetailsInfo: Partial<
    Record<string, { title: string; points: string[] }>
  > = {
    [Role.ReputationOracle]: {
      title: 'Reputation Oracle',
      points: [
        'The Reputation Oracle is the trust engine of HUMAN Protocol.',
        'It cross-checks validated solutions from the Recording Oracle, adjusts reputation scores, and manages payments.',
        "It's the final seal of quality and trust within the ecosystem.",
      ],
    },
    [Role.RecordingOracle]: {
      title: 'Recording Oracle',
      points: [
        'The Recording Oracle is where task solutions get the green light.',
        'It is storing, and recording task solutions on the blockchain.',
        "From quality checks to reputation adjustments, it's the assurance you need for dependable results.",
      ],
    },
    [Role.ExchangeOracle]: {
      title: 'Exchange Oracle',
      points: [
        "The Exchange Oracle is the HUMAN Protocol's powerhouse, directing tasks to skilled workers and ensuring smooth communication.",
        'It validates solutions, provides job updates, and handles cancellations, streamlining the job lifecycle.',
      ],
    },
    [Role.JobLauncher]: {
      title: 'Job Launcher',
      points: [
        'The Job Launcher is a tool that allows anybody to create and launch jobs, to be distributed as tasks through the HUMAN App.',
      ],
    },
  };

  const details = roleDetailsInfo[role];

  if (!details) {
    return null;
  }

  return <RoleInformation points={details.points} title={details.title} />;
};

const renderReputationTitle = (reputation: Reputation) => {
  const reputationAttributes: Record<
    Reputation,
    { title: string; colors: { title: string; border: string } }
  > = {
    High: {
      title: 'High',
      colors: {
        title: colorPalette.success.main,
        border: colorPalette.success.light,
      },
    },
    Medium: {
      title: 'Medium',
      colors: {
        title: colorPalette.warning.main,
        border: colorPalette.warning.light,
      },
    },

    Low: {
      title: 'Low',
      colors: {
        title: colorPalette.orange.main,
        border: colorPalette.orange.light,
      },
    },
    Unknown: {
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

const renderRoleIcon = (role: AddressDetailsLeader['role']) => {
  if (!role) return null;
  const roleIcons = {
    [Role.ReputationOracle]: <ReputationOracleIcon />,
    [Role.ExchangeOracle]: <ExchangeOracleIcon />,
    [Role.JobLauncher]: <JobLauncherIcon />,
    [Role.RecordingOracle]: <RecordingOracleIcon />,
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
          borderRadius: '16px',
          boxShadow: 'none',
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
          {env.VITE_HUMANPROTOCOL_CORE_ARCHITECTURE ? (
            <Box
              sx={{
                borderRadius: 16,
                backgroundColor: colorPalette.overlay.light,
                display: 'inline-block',
                paddingY: 1,
                paddingX: 1.5,
                textDecoration: 'none',
              }}
              component="a"
              href={env.VITE_HUMANPROTOCOL_CORE_ARCHITECTURE}
              target="_blank"
            >
              <Typography color={colorPalette.ocean.main}>
                HUMAN Protocol core architecture
              </Typography>
            </Box>
          ) : null}
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
              <Typography variant="subtitle2">Role</Typography>
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
              variant="subtitle2"
            >
              Network
            </Typography>
            <Typography variant="body2">
              {getNetwork(chainId)?.name || ''}
            </Typography>
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
              <CustomTooltip title="Reputation of the role as per their activities">
                <IconButton
                  sx={{
                    padding: 0,
                    paddingRight: 1,
                    color: colorPalette.fog.main,
                  }}
                >
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </CustomTooltip>
              <Typography variant="subtitle2">Reputation Score</Typography>
            </Stack>
            {renderReputationTitle(reputation)}
          </Stack>
          <Stack gap={{ xs: 1, md: 0 }} direction={{ sm: 'column', md: 'row' }}>
            <Typography
              sx={{
                width: 300,
              }}
              variant="subtitle2"
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
          borderRadius: '16px',
          boxShadow: 'none',
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
          {amountStaked !== undefined && amountStaked !== null ? (
            <Stack
              gap={{ xs: 1, md: 0 }}
              direction={{ sm: 'column', md: 'row' }}
            >
              <Typography
                sx={{
                  width: 300,
                }}
                variant="subtitle2"
              >
                Tokens Staked
              </Typography>
              <Stack sx={{ whiteSpace: 'nowrap', flexDirection: 'row' }}>
                <Typography variant="body2">
                  <FormatNumberWithDecimals value={amountStaked} />
                </Typography>
                <Typography
                  sx={{
                    marginLeft: 0.5,
                  }}
                  variant="body2"
                  color={colorPalette.fog.main}
                  component="span"
                >
                  HMT
                </Typography>
              </Stack>
            </Stack>
          ) : null}
          {amountLocked !== undefined && amountLocked !== null ? (
            <Stack
              gap={{ xs: 1, md: 0 }}
              direction={{ sm: 'column', md: 'row' }}
            >
              <Typography
                sx={{
                  width: 300,
                }}
                variant="subtitle2"
              >
                Tokens Locked
              </Typography>
              <Stack sx={{ whiteSpace: 'nowrap', flexDirection: 'row' }}>
                <Typography variant="body2">
                  <FormatNumberWithDecimals value={amountLocked} />
                </Typography>
                <Typography
                  sx={{
                    marginLeft: 0.5,
                  }}
                  variant="body2"
                  color={colorPalette.fog.main}
                  component="span"
                >
                  HMT
                </Typography>
              </Stack>
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
