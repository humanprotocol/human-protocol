import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Role } from '@human-protocol/sdk';

import SectionWrapper from '@components/SectionWrapper';
import TitleSectionWrapper from '@components/SearchResults/TitleSectionWrapper';
import { RoleDetailsEscrowsTable } from '@pages/SearchResults/RoleDetails/RoleDetailsEscrows/RoleDetailsEscrowsTable';
import KVStore from '../KVStore';
import ReputationScore from '../ReputationScore';
import StakeInfo from '../StakeInfo';
import HmtBalance from '../HmtBalance';
import HmtPrice from '../HmtPrice';

import ReputationOracleIcon from '@assets/icons/reputation-oracle.svg';
import ExchangeOracleIcon from '@assets/icons/exchange-oracle.svg';
import JobLauncherIcon from '@assets/icons/job-launcher.svg';
import RecordingOracleIcon from '@assets/icons/recording-oracle.svg';

import { AddressDetailsOperator } from '@services/api/use-address-details';
import { env } from '@helpers/env';
import { colorPalette } from '@assets/styles/color-palette';

interface RoleInfoProps {
  title: string;
  points: string[];
  role: string;
}

const renderRoleIcon = (role: string | null) => {
  if (!role) return null;

  const roleIcons = {
    [Role.ReputationOracle]: <ReputationOracleIcon />,
    [Role.ExchangeOracle]: <ExchangeOracleIcon />,
    [Role.JobLauncher]: <JobLauncherIcon />,
    [Role.RecordingOracle]: <RecordingOracleIcon />,
  };

  return roleIcons[role];
};

const RoleInformation = ({ title, points, role }: RoleInfoProps) => {
  return (
    <Stack direction="column">
      {renderRoleIcon(role)}
      <Typography variant="body2" mt={2}>
        {title}
      </Typography>
      <List disablePadding sx={{ listStyleType: 'disc', pl: 2 }}>
        {points.map((elem, idx) => (
          <ListItem
            key={idx}
            sx={{
              display: 'list-item',
              p: 0,
            }}
          >
            <Typography variant="body2">{elem}</Typography>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
};

const renderRoleDetailsInfo = (role: string | null) => {
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

  return (
    <RoleInformation
      points={details.points}
      title={details.title}
      role={role}
    />
  );
};

const RoleDetails = ({ data }: { data: AddressDetailsOperator }) => {
  const {
    balance,
    role,
    reputation,
    amountJobsProcessed,
    amountStaked,
    amountLocked,
    amountWithdrawable,
    url,
    fee,
    jobTypes,
  } = data;

  return (
    <>
      <SectionWrapper>
        <Box display="flex" flexDirection="column" gap={1.5} mb={4}>
          <Typography variant="h5">Overview</Typography>
          {env.VITE_HUMANPROTOCOL_CORE_ARCHITECTURE ? (
            <Box
              sx={{
                borderRadius: 16,
                bgcolor: colorPalette.overlay.light,
                display: 'inline-block',
                py: 1,
                px: 1.5,
                textDecoration: 'none',
                width: 'fit-content',
              }}
              component="a"
              href={env.VITE_HUMANPROTOCOL_CORE_ARCHITECTURE}
              target="_blank"
            >
              <Typography variant="Chip" color={colorPalette.ocean.main}>
                HUMAN Protocol core architecture
              </Typography>
            </Box>
          ) : null}
        </Box>
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
          <TitleSectionWrapper
            title="Role"
            tooltip="Role played by the operator in the protocol"
          >
            {renderRoleDetailsInfo(role)}
          </TitleSectionWrapper>
          {url && (
            <TitleSectionWrapper title="URL" tooltip="Operator website">
              <Link href={url} target="_blank" color="primary.main">
                {url}
              </Link>
            </TitleSectionWrapper>
          )}
          {jobTypes && jobTypes?.length > 0 && (
            <TitleSectionWrapper
              title="Task Types"
              tooltip="Type of tasks the operator can process"
            >
              <Box display="flex" flexWrap="wrap" gap={1}>
                {jobTypes.map((jobType) => (
                  <Chip
                    key={jobType}
                    variant="filled"
                    label={jobType}
                    sx={{
                      color: 'text.primary',
                      bgcolor: 'rgba(203, 207, 232, 0.28)',
                    }}
                  />
                ))}
              </Box>
            </TitleSectionWrapper>
          )}
          {fee && (
            <TitleSectionWrapper title="Fee" tooltip="Fee of the operator">
              <Typography variant="body2">{fee}%</Typography>
            </TitleSectionWrapper>
          )}
          <TitleSectionWrapper
            title="Tasks Processed"
            tooltip="Number of tasks that the operator has processed so far"
          >
            <Typography variant="body2">{amountJobsProcessed}</Typography>
          </TitleSectionWrapper>
        </Stack>
      </SectionWrapper>

      <StakeInfo
        amountStaked={amountStaked}
        amountLocked={amountLocked}
        amountWithdrawable={amountWithdrawable}
      />
      <KVStore />
      <RoleDetailsEscrowsTable role={role} />
    </>
  );
};
export default RoleDetails;
