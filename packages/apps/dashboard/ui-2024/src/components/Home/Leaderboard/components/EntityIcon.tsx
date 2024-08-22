import recording from '@assets/recording.png';
import reputation from '@assets/reputation.png';
import exchange from '@assets/exchange.png';
import human from '@assets/human.png';

export const EntityIcon: React.FC<{ role: string }> = ({ role }) => {
	let src = '';
	switch (role) {
		case 'Job Launcher':
			return (
				<div className="icon-table">
					<span>JL</span>
				</div>
			);
		case 'Recording Oracle':
			src = recording;
			break;
		case 'Reputation Oracle':
			src = reputation;
			break;
		case 'Exchange Oracle':
			src = exchange;
			break;
		case 'HUMAN App':
			src = human;
			break;
		default:
			src = human;
			break;
	}

	return (
		<div className="icon-table">
			<img src={src} alt="logo" />
		</div>
	);
};
