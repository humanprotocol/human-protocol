import {
	CartesianGrid,
	Line,
	Tooltip,
	XAxis,
	YAxis,
	LineChart as LineChartRecharts,
	ResponsiveContainer,
} from 'recharts';
import CustomChartTooltip from './CustomChartTooltip';
import { useState } from 'react';
import Card from '@mui/material/Card';
import { FormControlLabel, FormGroup, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import { colorPalette } from '@assets/styles/color-palette';
import CustomXAxisTick from '@components/Charts/CustomXAxisTick';
import DatePicker from '@components/data-entry/DatePicker';
import ToggleButtons from '@components/data-entry/ToggleButtons';
import dayjs, { Dayjs } from 'dayjs';

const HARDCODED_CHART_DATA = [
	{
		name: 'Test 1',
		transferAmount: 100,
		transactionsCount: 2000,
		uniqueReceivers: 3000,
		uniqueSenders: 200,
	},
	{
		name: 'Test 2',
		transferAmount: 150,
		transactionsCount: 2200,
		uniqueReceivers: 3200,
		uniqueSenders: 250,
	},
	{
		name: 'Test 3',
		transferAmount: 200,
		transactionsCount: 2500,
		uniqueReceivers: 3500,
		uniqueSenders: 300,
	},
	{
		name: 'Test 4',
		transferAmount: 120,
		transactionsCount: 2100,
		uniqueReceivers: 3100,
		uniqueSenders: 220,
	},
	{
		name: 'Test 5',
		transferAmount: 180,
		transactionsCount: 2300,
		uniqueReceivers: 3400,
		uniqueSenders: 270,
	},
	{
		name: 'Test 6',
		transferAmount: 130,
		transactionsCount: 2400,
		uniqueReceivers: 3300,
		uniqueSenders: 230,
	},
	{
		name: 'Test 7',
		transferAmount: 170,
		transactionsCount: 2600,
		uniqueReceivers: 3600,
		uniqueSenders: 280,
	},
	{
		name: 'Test 8',
		transferAmount: 140,
		transactionsCount: 2700,
		uniqueReceivers: 3700,
		uniqueSenders: 240,
	},
	{
		name: 'Test 9',
		transferAmount: 160,
		transactionsCount: 2800,
		uniqueReceivers: 3800,
		uniqueSenders: 290,
	},
	{
		name: 'Test 10',
		transferAmount: 190,
		transactionsCount: 2900,
		uniqueReceivers: 3900,
		uniqueSenders: 310,
	},
];

const TIME_PERIOD_OPTIONS = [
	{
		value: '1W',
		name: '1W',
	},
	{
		value: '1M',
		name: '1M',
	},
	{
		value: '6M',
		name: '6M',
	},
	{
		value: '1Y',
		name: '1Y',
	},
	{
		value: 'All',
		name: 'All',
	},
];

const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
	if (event.target.value === 'TransferAmount') {
		console.log('dupa');
	}
	console.log(event.target.value);
};

export const LineChart = () => {
	const [chartData, setChartData] =
		useState<Record<string, string | number>[]>(HARDCODED_CHART_DATA);
	const [selectedTimePeriod, selectTimePeriod] = useState<string>('1W');
	const [fromDate, setFromDate] = useState<Dayjs>(dayjs(new Date()));
	const [toDate, setToDate] = useState<Dayjs>(dayjs(new Date()));

	const onFromDateChange = (value: Dayjs | null) => {
		if (value) setFromDate(value);
	};

	const onToDateChange = (value: Dayjs | null) => {
		if (value) setToDate(value);
	};

	const handleTimePeriod = (
		_event: React.MouseEvent<HTMLElement>,
		value: string | null
	) => {
		if (value !== null) {
			selectTimePeriod(value);
		}
	};

	console.log(selectedTimePeriod);

	return (
		<Card
			sx={{
				paddingY: { xs: 4, md: 4 },
				paddingX: { xs: 2, md: 8 },
			}}
		>
			<Stack
				sx={{ marginBottom: 4 }}
				direction={{ xs: 'column', md: 'row' }}
				gap={{ xs: 6, md: 8 }}
			>
				<ToggleButtons
					options={TIME_PERIOD_OPTIONS}
					onChange={handleTimePeriod}
					value={selectedTimePeriod}
				/>
				<Stack direction="row" alignItems="center" gap={2}>
					<DatePicker onChange={onFromDateChange} value={fromDate} />
					<Typography>-</Typography>
					<DatePicker onChange={onToDateChange} value={toDate} />
				</Stack>
			</Stack>
			<ResponsiveContainer height={300}>
				<LineChartRecharts data={chartData}>
					<CartesianGrid stroke="#ccc" strokeDasharray="5" vertical={false} />
					<XAxis
						tick={<CustomXAxisTick />}
						height={50}
						stroke={colorPalette.fog.dark}
						tickSize={20}
						axisLine={false}
						dataKey="name"
						tickMargin={10}
					/>
					<YAxis />
					<Tooltip content={CustomChartTooltip} />
					<Line
						type="monotone"
						dataKey="transferAmount"
						stroke={colorPalette.primary.main}
					/>
					<Line
						type="monotone"
						dataKey="transactionsCount"
						stroke={colorPalette.secondary.main}
					/>
					<Line
						type="monotone"
						dataKey="uniqueReceivers"
						stroke={colorPalette.error.main}
					/>
					<Line
						type="monotone"
						dataKey="uniqueSenders"
						stroke={colorPalette.success.main}
					/>
				</LineChartRecharts>
			</ResponsiveContainer>
			<Card
				sx={{
					paddingY: 3,
					marginTop: 3,
					paddingX: 4,
					backgroundColor: colorPalette.night.light,
				}}
			>
				<FormGroup>
					<Stack
						gap={{ xs: 2, md: 6 }}
						direction={{ xs: 'column', md: 'row' }}
						justifyContent="center"
					>
						<FormControlLabel
							sx={{ m: 0 }}
							control={
								<Checkbox
									value="TransferAmount"
									onChange={handleChange}
									defaultChecked
									sx={{
										'&.Mui-checked': {
											color: colorPalette.primary.main,
										},
									}}
								/>
							}
							label={<Typography fontWeight={600}>Transfer Amount</Typography>}
						/>
						<FormControlLabel
							sx={{ margin: 0 }}
							control={
								<Checkbox
									sx={{
										'&.Mui-checked': {
											color: colorPalette.secondary.main,
										},
									}}
									value="transactionsCount"
									onChange={handleChange}
									defaultChecked
								/>
							}
							label={
								<Typography fontWeight={600}>Transactions Count</Typography>
							}
						/>
						<FormControlLabel
							sx={{ margin: 0 }}
							control={
								<Checkbox
									sx={{
										'&.Mui-checked': {
											color: colorPalette.error.main,
										},
									}}
									value="uniqueReceivers"
									onChange={handleChange}
									defaultChecked
								/>
							}
							label={<Typography fontWeight={600}>Unique Receivers</Typography>}
						/>
						<FormControlLabel
							sx={{ margin: 0 }}
							control={
								<Checkbox
									sx={{
										'&.Mui-checked': {
											color: colorPalette.success.main,
										},
									}}
									value="uniqueSenders"
									onChange={handleChange}
									defaultChecked
								/>
							}
							label={<Typography fontWeight={600}>Unique Senders</Typography>}
						/>
					</Stack>
				</FormGroup>
			</Card>
		</Card>
	);
};
