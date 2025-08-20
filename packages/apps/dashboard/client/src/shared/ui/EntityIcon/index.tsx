import { Role } from '@human-protocol/sdk/src/constants';

import ExchangeOracleIcon from '@/shared/ui/icons/ExchangeOracleIcon';
import HumanIcon from '@/shared/ui/icons/HumanIcon';
import JobLauncherIcon from '@/shared/ui/icons/JobLauncherIcon';
import RecordingOracleIcon from '@/shared/ui/icons/RecordingOracleIcon';
import ReputationOracleIcon from '@/shared/ui/icons/ReputationOracleIcon';

const EntityIcon: React.FC<{ role: string }> = ({ role }) => {
  switch (role) {
    case Role.JobLauncher:
      return <JobLauncherIcon />;
    case Role.RecordingOracle:
      return <RecordingOracleIcon />;
    case Role.ReputationOracle:
      return <ReputationOracleIcon />;
    case Role.ExchangeOracle:
      return <ExchangeOracleIcon />;
    default:
      return <HumanIcon />;
  }
};

export default EntityIcon;
