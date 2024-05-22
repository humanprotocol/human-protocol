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
import { useEffect, useRef, useState } from 'react';
import Card from '@mui/material/Card';
import { Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import { colorPalette } from '@assets/styles/color-palette';
import CustomXAxisTick from '@components/Charts/CustomXAxisTick';
import DatePicker from '@components/data-entry/DatePicker';
import ToggleButtons from '@components/data-entry/ToggleButtons';
import dayjs, { Dayjs } from 'dayjs';
import ToggleCharts from '@components/Charts/ToggleCharts';

const HARDCODED_CHART_DATA = [
	{
		name: 'Jan 1',
		transferAmount: 100,
		transactionsCount: 2000,
		uniqueReceivers: 3000,
		uniqueSenders: 200,
	},
	{
		name: 'Jan 2',
		transferAmount: 150,
		transactionsCount: 2200,
		uniqueReceivers: 3200,
		uniqueSenders: 250,
	},
	{
		name: 'Jan 3',
		transferAmount: 200,
		transactionsCount: 2500,
		uniqueReceivers: 3500,
		uniqueSenders: 300,
	},
	{
		name: 'Jan 4',
		transferAmount: 120,
		transactionsCount: 2100,
		uniqueReceivers: 3100,
		uniqueSenders: 220,
	},
	{
		name: 'Jan 5',
		transferAmount: 180,
		transactionsCount: 2300,
		uniqueReceivers: 3400,
		uniqueSenders: 270,
	},
	{
		name: 'Jan 6',
		transferAmount: 130,
		transactionsCount: 2400,
		uniqueReceivers: 3300,
		uniqueSenders: 230,
	},
	{
		name: 'Jan 7',
		transferAmount: 170,
		transactionsCount: 2600,
		uniqueReceivers: 3600,
		uniqueSenders: 280,
	},
	{
		name: 'Jan 8',
		transferAmount: 140,
		transactionsCount: 2700,
		uniqueReceivers: 3700,
		uniqueSenders: 2400,
	},
	{
		name: 'Jan 9',
		transferAmount: 160,
		transactionsCount: 2800,
		uniqueReceivers: 3800,
		uniqueSenders: 2900,
	},
	{
		name: 'Jan 10',
		transferAmount: 190,
		transactionsCount: 600,
		uniqueReceivers: 1000,
		uniqueSenders: 5000,
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
const HOVERED_CHARTS_DEFAULT_STATE = {
	transferAmount: false,
	transactionsCount: false,
	uniqueReceivers: false,
	uniqueSenders: false,
};

export const AreaChart = () => {
	const [chartData] = useState(HARDCODED_CHART_DATA);
	const [selectedTimePeriod, selectTimePeriod] = useState<string>('1W');
	const [fromDate, setFromDate] = useState<Dayjs>(dayjs(new Date()));
	const [toDate, setToDate] = useState<Dayjs>(dayjs(new Date()));
	const [checkedCharts, setCheckedCharts] = useState(
		CHECKED_CHARTS_DEFAULT_STATE
	);
	const chartRef = useRef<HTMLDivElement>(null);

	const [currentHoveredChart, setCurrentHoveredChart] = useState(
		HOVERED_CHARTS_DEFAULT_STATE
	);

	const toggleChart = (event: React.ChangeEvent<HTMLInputElement>) => {
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

	const onChartHover = (name: string) => {
		setCurrentHoveredChart((prevState) => ({
			...prevState,
			[name]: true,
		}));
	};

	const onChartLeave = () => {
		setCurrentHoveredChart(HOVERED_CHARTS_DEFAULT_STATE);
	};

	useEffect(() => {
		const currentRef = chartRef.current;
		if (currentRef) {
			const handleScrollChangeDate = (event: WheelEvent) => {
				if (event.deltaY < 0) {
					setFromDate((prevState) => {
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
	}, []);

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
				<AreaChartRecharts data={chartData}>
					<defs>
						<linearGradient
							id="colorTransferAmount"
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<stop
								offset={currentHoveredChart.transferAmount ? '20%' : '30%'}
								stopColor="#330B8D33"
								stopOpacity={currentHoveredChart.transferAmount ? 1 : 0.2}
							/>
							<stop
								offset={currentHoveredChart.transferAmount ? '90%' : '60%'}
								stopColor="#330B8D00"
								stopOpacity={currentHoveredChart.transferAmount ? 1 : 0}
							/>
						</linearGradient>
						<linearGradient
							id="colorTransactionsCount"
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<stop
								offset={currentHoveredChart.transactionsCount ? '20%' : '30%'}
								stopColor="#6309FF26"
								stopOpacity={currentHoveredChart.transactionsCount ? 1 : 0.2}
							/>
							<stop
								offset={currentHoveredChart.transactionsCount ? '90%' : '60%'}
								stopColor="#6309FF00"
								stopOpacity={currentHoveredChart.transactionsCount ? 1 : 0}
							/>
						</linearGradient>
						<linearGradient
							id="colorUniqueRecievers"
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<stop
								offset={currentHoveredChart.uniqueReceivers ? '20%' : '30%'}
								stopColor="#F20D5F33"
								stopOpacity={currentHoveredChart.uniqueReceivers ? 1 : 0.2}
							/>
							<stop
								offset={currentHoveredChart.uniqueReceivers ? '90%' : '60%'}
								stopColor="#F20D5F00"
								stopOpacity={currentHoveredChart.uniqueReceivers ? 1 : 0}
							/>
						</linearGradient>
						<linearGradient id="colorUniqueSenders" x1="0" y1="0" x2="0" y2="1">
							<stop
								offset={currentHoveredChart.uniqueSenders ? '20%' : '30%'}
								stopColor="#0AD39780"
								stopOpacity={currentHoveredChart.uniqueSenders ? 1 : 0.2}
							/>
							<stop
								offset={currentHoveredChart.uniqueSenders ? '90%' : '70%'}
								stopColor="#0AD39700"
								stopOpacity={currentHoveredChart.uniqueSenders ? 1 : 0}
							/>
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
					backgroundColor: colorPalette.overlay.light,
				}}
			>
				<ToggleCharts
					handleChange={toggleChart}
					onMouseLeave={onChartLeave}
					onMouseEnter={onChartHover}
					chartOptions={[
						{
							title: 'Transfer Amount',
							isAreaChart: true,
							name: 'transferAmount',
							amount: chartData[chartData.length - 1].transferAmount,
							color: colorPalette.primary.main,
						},
						{
							title: 'Transactions Count',
							name: 'transactionsCount',
							amount: chartData[chartData.length - 1].transactionsCount,
							color: colorPalette.secondary.main,
						},
						{
							title: 'Unique Receivers',
							name: 'uniqueReceivers',
							amount: chartData[chartData.length - 1].uniqueReceivers,
							color: colorPalette.error.main,
						},
						{
							title: 'Unique Senders',
							name: 'uniqueSenders',
							amount: chartData[chartData.length - 1].uniqueSenders,
							color: colorPalette.success.main,
						},
					]}
				/>
			</Card>
		</Card>
	);
};
