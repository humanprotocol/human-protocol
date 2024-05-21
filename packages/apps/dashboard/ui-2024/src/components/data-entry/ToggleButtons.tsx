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
	'.MuiToggleButtonGroup-root': {
		color: 'red',
	},
});

interface ToggleButtonsProps {
	options: { name: string; value: string }[];
	value: string;
	onChange: (
		_event: React.MouseEvent<HTMLElement>,
		value: string | null
	) => void;
}

const ToggleButtons = ({ value, onChange, options }: ToggleButtonsProps) => {
	return (
		<StyledToggleButtonGroup
			value={value}
			aria-label="text-alignment"
			onChange={onChange}
			exclusive
			sx={{
				gap: 1,
			}}
		>
			{options.map((elem) => (
				<ToggleButton
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
