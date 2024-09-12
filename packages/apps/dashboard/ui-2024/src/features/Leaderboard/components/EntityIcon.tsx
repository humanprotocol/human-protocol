import { ExchangeOracleIcon } from '@components/Icons/ExchangeOracleIcon';
import HumanIcon from '@components/Icons/HumanIcon';
import { JobLauncher } from '@components/Icons/JobLauncher';
import { RecordingOracle } from '@components/Icons/RecordingOracle';
import { ReputationOracle } from '@components/Icons/ReputationOracle';

export const EntityIcon: React.FC<{ role: string }> = ({ role }) => {
	switch (role) {
		case 'Job Launcher':
			return <JobLauncher />;
		case 'Recording Oracle':
			return <RecordingOracle />;
		case 'Reputation Oracle':
			return <ReputationOracle />;
		case 'Exchange Oracle':
			return <ExchangeOracleIcon />;
		case 'HUMAN App':
			return <HumanIcon />;
		default:
			return <HumanIcon />;
	}
};
