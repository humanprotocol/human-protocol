import { TooltipProps } from 'recharts';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { colorPalette } from '@assets/styles/color-palette';
import { formatDate } from '@helpers/formatDate';

const renderTitle = (title: string) => {
	const currentTitle: Record<string, string> = {
		transferAmount: 'Transfer Amount',
		transactionsCount: 'Transactions Count',
		uniqueReceivers: 'Unique Receivers',
		uniqueSenders: 'Unique Senders',
	};
	return currentTitle[title];
};

const CustomChartTooltip = ({
	payload,
	label,
	active,
}: TooltipProps<number, string>) => {
	if (active) {
		return (
			<Card
				sx={{
					border: `2px solid ${colorPalette.fog.light}`,
				}}
			>
				<Box
					sx={{
						paddingX: 2,
						paddingY: 1,
					}}
				>
					<Typography
						color={colorPalette.fog.main}
						variant="subtitle1"
						fontWeight={500}
					>
						{formatDate(label, 'MMMM d, YYYY')}
					</Typography>
					{payload?.map((elem) => (
						<Stack key={elem.name} direction="row" alignItems="center" gap={2}>
							<Stack direction="row" alignItems="center" gap={1}>
								<FiberManualRecordIcon
									sx={{
										color: elem.stroke,
									}}
								/>
								<Typography fontWeight={500} variant="subtitle1">
									{renderTitle(elem.name ?? '')}
								</Typography>
							</Stack>
							<Typography variant="subtitle2">
								{elem.value} {elem.name === 'transferAmount' ? 'HMT' : ''}
							</Typography>
						</Stack>
					))}
				</Box>
			</Card>
		);
	}
	return null;
};

export default CustomChartTooltip;
