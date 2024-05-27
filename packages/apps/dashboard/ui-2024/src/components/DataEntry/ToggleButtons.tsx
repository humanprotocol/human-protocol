import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { colorPalette } from '@assets/styles/color-palette';

export const StyledToggleButtonGroup = styled(ToggleButtonGroup)({
	'.MuiToggleButtonGroup-grouped': {
		border: 'none',
		borderRadius: 4,
		width: 50,
		color: colorPalette.primary.main,
	},
});

interface ToggleButtonsProps {
	buttonOptions: { name: string; value: string }[];
	selectedValue: string;
	onValueChange: (
		_event: React.MouseEvent<HTMLElement>,
		value: string | null
	) => void;
}

const ToggleButtons = ({
	selectedValue,
	onValueChange,
	buttonOptions,
}: ToggleButtonsProps) => {
	return (
		<StyledToggleButtonGroup
			value={selectedValue}
			aria-label="text-alignment"
			onChange={onValueChange}
			exclusive
			sx={{
				gap: 1,
			}}
		>
			{buttonOptions.map((elem) => (
				<ToggleButton
					key={elem.name}
					sx={{
						'&.Mui-selected': {
							backgroundColor: colorPalette.primary.main,
							color: colorPalette.white,
						},
						'&.Mui-selected:hover': {
							cursor: 'pointer',
							backgroundColor: colorPalette.primary.main,
						},
					}}
					value={elem.value}
				>
					<Typography fontWeight={600}>{elem.name}</Typography>
				</ToggleButton>
			))}
		</StyledToggleButtonGroup>
	);
};

export default ToggleButtons;
