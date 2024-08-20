import { FormControlLabel, FormGroup, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import { colorPalette } from '@assets/styles/color-palette';

interface ToggleChartsProps {
	handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onMouseEnter?: (name: string) => void;
	onMouseLeave?: () => void;
	chartOptions: {
		title: string;
		isAreaChart?: boolean;
		name: string;
		color: string;
		amount?: number | string;
	}[];
}

const ToggleCharts = ({
	handleChange,
	chartOptions,
	onMouseLeave,
	onMouseEnter,
}: ToggleChartsProps) => {
	return (
		<FormGroup
			sx={{
				marginX: { sx: 4, md: 0 },
			}}
		>
			<Stack
				gap={{ xs: 2, md: 6 }}
				direction={{ xs: 'column', md: 'row' }}
				justifyContent="center"
			>
				{chartOptions.map((elem) => (
					<FormControlLabel
						onMouseEnter={() =>
							onMouseEnter ? onMouseEnter(elem.name) : undefined
						}
						onMouseLeave={() => (onMouseLeave ? onMouseLeave() : undefined)}
						id={elem.name}
						key={elem.name}
						sx={{
							m: 0,
							gap: 1,
						}}
						control={
							<Checkbox
								name={elem.name}
								onChange={handleChange}
								defaultChecked
								sx={{
									'&.Mui-checked': {
										color: elem.color,
									},
								}}
							/>
						}
						label={
							<>
								<Typography fontWeight={600}>{elem.title}</Typography>
								<Typography variant="h4" component="p">
									{elem.amount ? elem.amount.toLocaleString('en-US') : ''}
									{elem.name === 'totalTransactionAmount' &&
										elem.isAreaChart && (
											<Typography
												variant="h4"
												component="span"
												sx={{
													marginLeft: 1,
													color: colorPalette.fog.main,
												}}
											>
												HMT
											</Typography>
										)}
								</Typography>
							</>
						}
					/>
				))}
			</Stack>
		</FormGroup>
	);
};

export default ToggleCharts;
