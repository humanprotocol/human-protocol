import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { colorPalette } from '@assets/styles/color-palette';
import {
	initialAllTime,
	TIME_PERIOD_OPTIONS,
	TimePeriod,
	useGraphPageChartParams,
} from '@utils/hooks/use-graph-page-chart-params';

export const StyledToggleButtonGroup = styled(ToggleButtonGroup)({
	'.MuiToggleButtonGroup-grouped': {
		border: 'none',
		borderRadius: 4,
		width: 50,
		color: colorPalette.primary.main,
	},
});

const ToggleButtons = () => {
	const {
		setTimePeriod,
		selectedTimePeriod,
		dateRangeParams,
		effectiveFromAllTimeDate,
	} = useGraphPageChartParams();

	const checkIfSelected = (element: TimePeriod) => {
		if (element.name !== 'ALL' || !effectiveFromAllTimeDate) {
			return element.value.isSame(dateRangeParams.from);
		}

		return dateRangeParams.from.isSame(effectiveFromAllTimeDate);
	};

	return (
		<StyledToggleButtonGroup
			value={selectedTimePeriod}
			aria-label="text-alignment"
			exclusive
		>
			{TIME_PERIOD_OPTIONS.map((elem) => (
				<ToggleButton
					onClick={() => {
						setTimePeriod(elem);
					}}
					selected={checkIfSelected(elem)}
					key={elem.name}
					sx={{
						'.MuiTypography-root': {
							wordBreak: 'normal',
						},
						'&.Mui-selected': {
							backgroundColor: colorPalette.primary.main,
							color: colorPalette.white,
						},
						'&.Mui-selected:hover': {
							cursor: 'pointer',
							backgroundColor: colorPalette.primary.main,
						},
					}}
					value={elem.name}
				>
					<Typography fontWeight={600}>{elem.name}</Typography>
				</ToggleButton>
			))}
		</StyledToggleButtonGroup>
	);
};

export default ToggleButtons;
