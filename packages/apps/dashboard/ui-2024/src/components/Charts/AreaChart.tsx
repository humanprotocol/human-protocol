import {
	CartesianGrid,
	Tooltip,
	XAxis,
	YAxis,
	AreaChart as AreaChartRecharts,
	Area,
	ResponsiveContainer,
} from 'recharts';
import CustomChartTooltip from './CustomChartTooltip';
import { useState } from 'react';
import Checkbox from '@mui/material/Checkbox';
import Card from '@mui/material/Card';
import { FormControlLabel, FormGroup, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import { colorPalette } from '@assets/styles/color-palette';
import CustomXAxisTick from '@components/Charts/CustomXAxisTick';
import DatePicker from '@components/data-entry/DatePicker';
import ToggleButtons from '@components/data-entry/ToggleButtons';
import dayjs, { Dayjs } from 'dayjs';

export type ChartTypes =
	| 'name'
	| 'transferAmount'
	| 'transactionsCount'
	| 'uniqueReceivers'
	| 'uniqueSenders';

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

export const AreaChart = () => {
	const [chartData] =
		useState<Record<ChartTypes, string | number>[]>(HARDCODED_CHART_DATA);
	const [selectedTimePeriod, selectTimePeriod] = useState<string>('1W');
	const [fromDate, setFromDate] = useState<Dayjs>(dayjs(new Date()));
	const [toDate, setToDate] = useState<Dayjs>(dayjs(new Date()));
	const [checkedCharts, setCheckedCharts] = useState({
		transferAmount: true,
		transactionsCount: true,
		uniqueReceivers: true,
		uniqueSenders: true,
	});

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setCheckedCharts({
			...checkedCharts,
			[event.target.name]: event.target.checked,
		});
	};

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

	console.log({ fromDate, toDate });
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
				<AreaChartRecharts data={chartData}>
					<defs>
						<linearGradient
							id="colorTransferAmount"
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<stop offset="30%" stopColor="#330B8D33" stopOpacity={0.2} />
							<stop offset="60%" stopColor="#330B8D00" stopOpacity={0} />
						</linearGradient>
						<linearGradient
							id="colorTransactionsCount"
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<stop offset="30%" stopColor="#6309FF26" stopOpacity={0.2} />
							<stop offset="60%" stopColor="#6309FF00" stopOpacity={0} />
						</linearGradient>
						<linearGradient
							id="colorUniqueRecievers"
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<stop offset="30%" stopColor="#F20D5F33" stopOpacity={0.2} />
							<stop offset="60%" stopColor="#F20D5F00" stopOpacity={0} />
						</linearGradient>
						<linearGradient id="colorUniqueSenders" x1="0" y1="0" x2="0" y2="1">
							<stop offset="30%" stopColor="#0AD39780" stopOpacity={0.2} />
							<stop offset="60%" stopColor="#0AD39700" stopOpacity={0} />
						</linearGradient>
					</defs>
					<YAxis />
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
					<Tooltip content={<CustomChartTooltip />} />
					{checkedCharts.transferAmount && (
						<Area
							type="monotone"
							dataKey="transferAmount"
							stroke={colorPalette.primary.main}
							fillOpacity={1}
							fill="url(#colorTransferAmount)"
						/>
					)}
					{checkedCharts.transactionsCount && (
						<Area
							type="monotone"
							dataKey="transactionsCount"
							stroke={colorPalette.secondary.main}
							fillOpacity={1}
							fill="url(#colorTransactionsCount)"
						/>
					)}
					{checkedCharts.uniqueReceivers && (
						<Area
							type="monotone"
							dataKey="uniqueReceivers"
							stroke={colorPalette.error.main}
							fillOpacity={1}
							fill="url(#colorUniqueRecievers)"
						/>
					)}
					{checkedCharts.uniqueSenders && (
						<Area
							type="monotone"
							dataKey="uniqueSenders"
							stroke={colorPalette.success.main}
							fillOpacity={1}
							fill="url(#colorUniqueSenders)"
						/>
					)}
				</AreaChartRecharts>
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
							sx={{
								m: 0,
								gap: 1,
							}}
							control={
								<Checkbox
									name="transferAmount"
									onChange={handleChange}
									defaultChecked
									sx={{
										'&.Mui-checked': {
											color: colorPalette.primary.main,
										},
									}}
								/>
							}
							label={
								<Stack direction="column">
									<Typography fontWeight={600}>Transfer Amount</Typography>
									<Typography variant="h5" fontWeight={500} component="p">
										{chartData[chartData.length - 1].transferAmount}
										<Typography
											variant="h5"
											component="span"
											sx={{
												marginLeft: 1,
												color: colorPalette.fog.main,
											}}
										>
											HMT
										</Typography>
									</Typography>
								</Stack>
							}
						/>
						<FormControlLabel
							sx={{
								gap: 1,
								m: 0,
							}}
							control={
								<Checkbox
									sx={{
										'&.Mui-checked': {
											color: colorPalette.secondary.main,
										},
									}}
									name="transactionsCount"
									onChange={handleChange}
									defaultChecked
								/>
							}
							label={
								<Stack>
									<Typography fontWeight={600}>Transactions Count</Typography>
									<Typography variant="h5" component="p">
										{chartData[chartData.length - 1].transactionsCount}
									</Typography>
								</Stack>
							}
						/>
						<FormControlLabel
							sx={{
								gap: 1,
								m: 0,
							}}
							control={
								<Checkbox
									sx={{
										'&.Mui-checked': {
											color: colorPalette.error.main,
										},
									}}
									name="uniqueReceivers"
									onChange={handleChange}
									defaultChecked
								/>
							}
							label={
								<Stack>
									<Typography fontWeight={600}>Unique Receivers</Typography>
									<Typography variant="h5" component="p">
										{chartData[chartData.length - 1].uniqueReceivers}
									</Typography>
								</Stack>
							}
						/>
						<FormControlLabel
							sx={{
								gap: 1,
								m: 0,
							}}
							control={
								<Checkbox
									sx={{
										'&.Mui-checked': {
											color: colorPalette.success.main,
										},
									}}
									name="uniqueSenders"
									onChange={handleChange}
									defaultChecked
								/>
							}
							label={
								<Stack>
									<Typography fontWeight={600}>Unique Senders</Typography>
									<Typography variant="h5" component="p">
										{chartData[chartData.length - 1].uniqueSenders}
									</Typography>
								</Stack>
							}
						/>
					</Stack>
				</FormGroup>
			</Card>
		</Card>
	);
};
