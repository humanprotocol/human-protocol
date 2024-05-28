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
import { useEffect, useRef, useState } from 'react';
import Card from '@mui/material/Card';
import { Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import { colorPalette } from '@assets/styles/color-palette';
import CustomXAxisTick from '@components/Charts/CustomXAxisTick';
import DatePicker from '@components/DataEntry/DatePicker';
import ToggleButtons from '@components/DataEntry/ToggleButtons';
import dayjs, { Dayjs } from 'dayjs';
import ToggleCharts from '@components/Charts/ToggleCharts';
import { formatNumber } from '@helpers/formatNumber';

const HARDCODED_CHART_DATA = [
	{
		name: '2024-01-01',
		transferAmount: 100,
		transactionsCount: 2000,
		uniqueReceivers: 3000,
		uniqueSenders: 200,
	},
	{
		name: '2024-01-02',
		transferAmount: 150,
		transactionsCount: 2200,
		uniqueReceivers: 3200,
		uniqueSenders: 250,
	},
	{
		name: '2024-01-03',
		transferAmount: 200,
		transactionsCount: 2500,
		uniqueReceivers: 3500,
		uniqueSenders: 300,
	},
	{
		name: '2024-01-04',
		transferAmount: 120,
		transactionsCount: 2100,
		uniqueReceivers: 3100,
		uniqueSenders: 220,
	},
	{
		name: '2024-01-05',
		transferAmount: 180,
		transactionsCount: 2300,
		uniqueReceivers: 3400,
		uniqueSenders: 270,
	},
	{
		name: '2024-01-06',
		transferAmount: 130,
		transactionsCount: 2400,
		uniqueReceivers: 3300,
		uniqueSenders: 230,
	},
	{
		name: '2024-01-07',
		transferAmount: 170,
		transactionsCount: 2600,
		uniqueReceivers: 3600,
		uniqueSenders: 280,
	},
	{
		name: '2024-01-08',
		transferAmount: 140,
		transactionsCount: 2700,
		uniqueReceivers: 3700,
		uniqueSenders: 240,
	},
	{
		name: '2024-01-09',
		transferAmount: 160,
		transactionsCount: 2800,
		uniqueReceivers: 3800,
		uniqueSenders: 290,
	},
	{
		name: '2024-01-10',
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

const CHECKED_CHARTS_DEFAULT_STATE = {
	transferAmount: true,
	transactionsCount: true,
	uniqueReceivers: true,
	uniqueSenders: true,
};

export const LineChart = () => {
	const [chartData] = useState(HARDCODED_CHART_DATA);
	const [selectedTimePeriod, selectTimePeriod] = useState<string>('1W');
	const [fromDate, setFromDate] = useState<Dayjs>(dayjs(new Date()));
	const [toDate, setToDate] = useState<Dayjs>(dayjs(new Date()));
	const [checkedCharts, setCheckedCharts] = useState(
		CHECKED_CHARTS_DEFAULT_STATE
	);
	const chartRef = useRef<HTMLDivElement>(null);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setCheckedCharts((prevState) => ({
			...prevState,
			[event.target.name]: event.target.checked,
		}));
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

	useEffect(() => {
		const currentRef = chartRef.current;
		if (currentRef) {
			const handleScrollChangeDate = (event: WheelEvent) => {
				if (event.deltaY < 0) {
					setFromDate((prevState) => {
						if (prevState.isAfter(toDate) || prevState.isSame(toDate)) {
							return prevState;
						}
						return prevState.add(1, 'day');
					});
				} else if (event.deltaY > 0) {
					setFromDate((prevState) => {
						return prevState.subtract(1, 'day');
					});
				}
			};

			currentRef.addEventListener('wheel', handleScrollChangeDate);

			return () => {
				currentRef.removeEventListener('wheel', handleScrollChangeDate);
			};
		}
	}, [toDate]);

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
					buttonOptions={TIME_PERIOD_OPTIONS}
					onValueChange={handleTimePeriod}
					selectedValue={selectedTimePeriod}
				/>
				<Stack direction="row" alignItems="center" gap={2}>
					<DatePicker onChange={onFromDateChange} value={fromDate} />
					<Typography>-</Typography>
					<DatePicker onChange={onToDateChange} value={toDate} />
				</Stack>
			</Stack>
			<ResponsiveContainer ref={chartRef} height={300}>
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
					<YAxis
						tickFormatter={formatNumber}
						tick={{ dx: -10 }}
						stroke={colorPalette.fog.main}
						tickSize={0}
						axisLine={false}
					/>
					<Tooltip content={CustomChartTooltip} />
					{checkedCharts.transferAmount && (
						<Line
							type="monotone"
							dataKey="transferAmount"
							stroke={colorPalette.primary.main}
						/>
					)}
					{checkedCharts.transactionsCount && (
						<Line
							type="monotone"
							dataKey="transactionsCount"
							stroke={colorPalette.secondary.main}
						/>
					)}
					{checkedCharts.uniqueReceivers && (
						<Line
							type="monotone"
							dataKey="uniqueReceivers"
							stroke={colorPalette.error.main}
						/>
					)}
					{checkedCharts.uniqueSenders && (
						<Line
							type="monotone"
							dataKey="uniqueSenders"
							stroke={colorPalette.success.main}
						/>
					)}
				</LineChartRecharts>
			</ResponsiveContainer>
			<Card
				sx={{
					paddingY: 3,
					marginTop: 3,
					paddingX: 4,
					backgroundColor: colorPalette.overlay.light,
				}}
			>
				<ToggleCharts
					handleChange={handleChange}
					chartOptions={[
						{
							title: 'Transfer Amount',
							name: 'transferAmount',
							color: colorPalette.primary.main,
						},
						{
							title: 'Transactions Count',
							name: 'transactionsCount',
							color: colorPalette.secondary.main,
						},
						{
							title: 'Unique Receivers',
							name: 'uniqueReceivers',
							color: colorPalette.error.main,
						},
						{
							title: 'Unique Senders',
							name: 'uniqueSenders',
							color: colorPalette.success.main,
						},
					]}
				/>
			</Card>
		</Card>
	);
};
