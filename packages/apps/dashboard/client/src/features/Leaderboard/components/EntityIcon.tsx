import { ExchangeOracleIcon } from '@components/Icons/ExchangeOracleIcon';
import HumanIcon from '@components/Icons/HumanIcon';
import { JobLauncher } from '@components/Icons/JobLauncher';
import { RecordingOracle } from '@components/Icons/RecordingOracle';
import { ReputationOracle } from '@components/Icons/ReputationOracle';
import { Role } from '@human-protocol/sdk';

export const EntityIcon: React.FC<{ role: string }> = ({ role }) => {
  switch (role) {
    case Role.JobLauncher:
      return <JobLauncher />;
    case Role.RecordingOracle:
      return <RecordingOracle />;
    case Role.ReputationOracle:
      return <ReputationOracle />;
    case Role.ExchangeOracle:
      return <ExchangeOracleIcon />;
    default:
      return <HumanIcon />;
  }
};
