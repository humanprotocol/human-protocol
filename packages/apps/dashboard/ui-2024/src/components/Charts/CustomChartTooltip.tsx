import { TooltipProps } from 'recharts';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import { Grid, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { colorPalette } from '@assets/styles/color-palette';
import { formatDate } from '@helpers/formatDate';
import { GraphPageChartDataConfigObject } from '@components/Charts/AreaChart';

const renderTitle = (title: string) => {
	const currentTitle: GraphPageChartDataConfigObject<string> = {
		totalTransactionAmount: 'Transfer Amount',
		totalTransactionCount: 'Transactions Count',
		solved: 'Number of Tasks',
		dailyUniqueReceivers: 'Unique Receivers',
		dailyUniqueSenders: 'Unique Senders',
	};
	return currentTitle[title as keyof GraphPageChartDataConfigObject<string>];
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
					border: `1px solid ${colorPalette.fog.light}`,
					borderRadius: '10px',
				}}
			>
				<Box
					sx={{
						padding: '6px 10px',
					}}
				>
					<Typography
						color={colorPalette.fog.main}
						variant="subtitle1"
						fontWeight={500}
					>
						{formatDate(label, 'MMMM DD, YYYY')}
					</Typography>
					{payload?.map((elem) => (
						<Box
							key={elem.name}
							sx={{
								display: 'grid',
								gap: 1,
								gridTemplateColumns: 'repeat(2, 1fr)',
							}}
						>
							<Stack direction="row" alignItems="center" gap={1} width="100%">
								<Grid container alignItems="center" gap={1}>
									<FiberManualRecordIcon
										sx={{
											color: elem.stroke,
											fontSize: '12px',
										}}
									/>
									<Typography fontWeight={500} variant="subtitle1">
										{renderTitle(elem.name ?? '')}
									</Typography>
								</Grid>
							</Stack>
							<Grid container width="100%">
								<Typography
									whiteSpace="nowrap"
									textAlign="start"
									variant="subtitle2"
								>
									{elem.value}{' '}
									{elem.name === 'totalTransactionAmount' ? 'HMT' : ''}
								</Typography>
							</Grid>
						</Box>
					))}
				</Box>
			</Card>
		);
	}
	return null;
};

export default CustomChartTooltip;
