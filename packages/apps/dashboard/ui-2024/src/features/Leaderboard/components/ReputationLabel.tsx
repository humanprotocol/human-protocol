export const ReputationLabel: React.FC<{ reputation: string }> = ({
	reputation,
}) => {
	switch (reputation) {
		case 'High':
			return (
				<div className="reputation-table reputation-table-high">
					{reputation}
				</div>
			);
		case 'Medium':
			return (
				<div className="reputation-table reputation-table-medium">
					{reputation}
				</div>
			);
		case 'Low':
			return (
				<div className="reputation-table reputation-table-low">
					{reputation}
				</div>
			);
		case 'Coming soon':
			return (
				<div className="reputation-table reputation-table-soon">
					{reputation}
				</div>
			);
		default:
			return (
				<div className="reputation-table reputation-table-soon">
					Coming soon
				</div>
			);
	}
};
