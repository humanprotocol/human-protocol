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
import DatePicker from '@components/DataEntry/DatePicker';
import ToggleButtons from '@components/DataEntry/ToggleButtons';
import { Dayjs } from 'dayjs';
import ToggleCharts from '@components/Charts/ToggleCharts';
import { formatNumber } from '@helpers/formatNumber';
import {
	GraphPageChartData,
	useGraphPageChartData,
} from '@services/api/use-graph-page-chart-data';
import { useGraphPageChartParams } from '@utils/hooks/use-graph-page-chart-params';

export type GraphPageChartDataConfigObject<T> = Partial<
	Record<keyof GraphPageChartData[number], T>
>;

const CHECKED_CHARTS_DEFAULT_STATE: GraphPageChartDataConfigObject<boolean> = {
	totalTransactionAmount: true,
	totalTransactionCount: true,
	solved: true,
	dailyUniqueReceivers: true,
	dailyUniqueSenders: true,
};
const HOVERED_CHARTS_DEFAULT_STATE: GraphPageChartDataConfigObject<boolean> = {
	totalTransactionAmount: false,
	totalTransactionCount: false,
	solved: false,
	dailyUniqueReceivers: false,
	dailyUniqueSenders: false,
};

type SumOfNumericChartDataProperties = Record<
	keyof Omit<GraphPageChartData[number], 'date' | 'served'>,
	number
>;

const sumNumericProperties = (
	chartData: GraphPageChartData
): SumOfNumericChartDataProperties => {
	return chartData.reduce(
		(acc, chartEntry) => {
			acc.dailyUniqueReceivers += chartEntry.dailyUniqueReceivers;
			acc.dailyUniqueSenders += chartEntry.dailyUniqueSenders;
			acc.solved += chartEntry.solved;
			acc.totalTransactionAmount += chartEntry.totalTransactionAmount;
			acc.totalTransactionCount += chartEntry.totalTransactionCount;
			return acc;
		},
		{
			dailyUniqueReceivers: 0,
			dailyUniqueSenders: 0,
			solved: 0,
			totalTransactionAmount: 0,
			totalTransactionCount: 0,
		}
	);
};

export const AreaChart = ({
	changeDateOnScroll = false,
}: {
	changeDateOnScroll?: boolean;
}) => {
	const { data } = useGraphPageChartData();
	const chartData = data || [];
	const {
		setFromDate,
		setToDate,
		clearTimePeriod,
		dateRangeParams: { from, to },
		effectiveFromAllTimeDate,
	} = useGraphPageChartParams();
	const sum = sumNumericProperties(chartData);
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
		if (!changeDateOnScroll) {
			return;
		}
		const currentRef = chartRef.current;
		if (currentRef) {
			const handleScrollChangeDate = (event: WheelEvent) => {
				event.preventDefault();
				clearTimePeriod();
				if (event.deltaY < 0) {
					if (from.add(1, 'day').isAfter(to)) {
						return;
					}
					setFromDate(from.add(1, 'day'));
				} else if (event.deltaY > 0) {
					if (effectiveFromAllTimeDate?.isSame(from)) {
						return;
					}
					setFromDate(from.subtract(1, 'day'));
				}
			};

			currentRef.addEventListener('wheel', handleScrollChangeDate);

			return () => {
				currentRef.removeEventListener('wheel', handleScrollChangeDate);
			};
		}
	}, [
		changeDateOnScroll,
		clearTimePeriod,
		effectiveFromAllTimeDate,
		from,
		setFromDate,
		to,
	]);

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
				<ToggleButtons />
				<Stack direction="row" alignItems="center" gap={2}>
					<DatePicker
						onChange={onFromDateChange}
						value={from}
						customProps={{
							disableFuture: true,
							maxDate: to,
							minDate: effectiveFromAllTimeDate,
						}}
					/>
					<Typography>-</Typography>
					<DatePicker
						onChange={onToDateChange}
						value={to}
						customProps={{
							disableFuture: true,
							minDate: from,
						}}
					/>
				</Stack>
			</Stack>
			<ResponsiveContainer ref={chartRef} height={300}>
				<AreaChartRecharts data={chartData}>
					<defs>
						<linearGradient
							id="colorTotalTransactionAmount"
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<stop
								offset={
									currentHoveredChart.totalTransactionAmount ? '20%' : '30%'
								}
								stopColor="#330B8D33"
								stopOpacity={
									currentHoveredChart.totalTransactionAmount ? 1 : 0.2
								}
							/>
							<stop
								offset={
									currentHoveredChart.totalTransactionAmount ? '90%' : '60%'
								}
								stopColor="#330B8D00"
								stopOpacity={currentHoveredChart.totalTransactionAmount ? 1 : 0}
							/>
						</linearGradient>
						<linearGradient
							id="colorTotalTransactionCount"
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<stop
								offset={
									currentHoveredChart.totalTransactionCount ? '20%' : '30%'
								}
								stopColor="#6309FF26"
								stopOpacity={
									currentHoveredChart.totalTransactionCount ? 1 : 0.2
								}
							/>
							<stop
								offset={
									currentHoveredChart.totalTransactionCount ? '90%' : '60%'
								}
								stopColor="#6309FF00"
								stopOpacity={currentHoveredChart.totalTransactionCount ? 1 : 0}
							/>
						</linearGradient>
						<linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
							<stop
								offset={currentHoveredChart.solved ? '20%' : '30%'}
								stopColor="#03a9f480"
								stopOpacity={currentHoveredChart.solved ? 1 : 0.2}
							/>
							<stop
								offset={currentHoveredChart.solved ? '90%' : '60%'}
								stopColor="#03a9f400"
								stopOpacity={currentHoveredChart.solved ? 1 : 0}
							/>
						</linearGradient>
						<linearGradient
							id="colorDailyUniqueReceivers"
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<stop
								offset={
									currentHoveredChart.dailyUniqueReceivers ? '20%' : '30%'
								}
								stopColor="#F20D5F33"
								stopOpacity={currentHoveredChart.dailyUniqueReceivers ? 1 : 0.2}
							/>
							<stop
								offset={
									currentHoveredChart.dailyUniqueReceivers ? '90%' : '60%'
								}
								stopColor="#F20D5F00"
								stopOpacity={currentHoveredChart.dailyUniqueReceivers ? 1 : 0}
							/>
						</linearGradient>
						<linearGradient
							id="colorDailyUniqueSenders"
							x1="0"
							y1="0"
							x2="0"
							y2="1"
						>
							<stop
								offset={currentHoveredChart.dailyUniqueSenders ? '20%' : '30%'}
								stopColor="#0AD39780"
								stopOpacity={currentHoveredChart.dailyUniqueSenders ? 1 : 0.2}
							/>
							<stop
								offset={currentHoveredChart.dailyUniqueSenders ? '90%' : '70%'}
								stopColor="#0AD39700"
								stopOpacity={currentHoveredChart.dailyUniqueSenders ? 1 : 0}
							/>
						</linearGradient>
					</defs>
					<YAxis
						tickFormatter={formatNumber}
						tick={{ dx: -10 }}
						tickSize={0}
						axisLine={false}
						stroke={colorPalette.fog.main}
					/>
					<CartesianGrid stroke="#ccc" strokeDasharray="5" vertical={false} />
					<XAxis
						axisLine={false}
						tick={<CustomXAxisTick />}
						height={50}
						stroke={colorPalette.fog.dark}
						tickSize={20}
						dataKey="date"
						tickMargin={10}
					/>
					<Tooltip content={<CustomChartTooltip />} />
					{checkedCharts.totalTransactionAmount && (
						<Area
							type="monotone"
							dataKey="totalTransactionAmount"
							stroke={colorPalette.primary.main}
							fillOpacity={1}
							fill="url(#colorTotalTransactionAmount)"
						/>
					)}
					{checkedCharts.totalTransactionCount && (
						<Area
							type="monotone"
							dataKey="totalTransactionCount"
							stroke={colorPalette.secondary.main}
							fillOpacity={1}
							fill="url(#colorTotalTransactionCount)"
						/>
					)}
					{checkedCharts.solved && (
						<Area
							type="monotone"
							dataKey="solved"
							stroke={colorPalette.ocean.dark}
							fillOpacity={1}
							fill="url(#colorSolved)"
						/>
					)}
					{checkedCharts.dailyUniqueReceivers && (
						<Area
							type="monotone"
							dataKey="dailyUniqueReceivers"
							stroke={colorPalette.error.light}
							fillOpacity={1}
							fill="url(#colorDailyUniqueReceivers)"
						/>
					)}
					{checkedCharts.dailyUniqueSenders && (
						<Area
							type="monotone"
							dataKey="dailyUniqueSenders"
							stroke={colorPalette.success.main}
							fillOpacity={1}
							fill="url(#colorDailyUniqueSenders)"
						/>
					)}
				</AreaChartRecharts>
			</ResponsiveContainer>
			<Card
				sx={{
					paddingY: 3,
					marginTop: 3,
					marginLeft: { xs: 0, xl: 6 },
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
							name: 'totalTransactionAmount',
							amount: `${Number(sum.totalTransactionAmount.toFixed())}`,
							color: colorPalette.primary.main,
						},
						{
							title: 'Transactions Count',
							name: 'totalTransactionCount',
							amount: sum.totalTransactionCount,
							color: colorPalette.secondary.main,
						},
						{
							title: 'Number of Tasks',
							name: 'solved',
							amount: sum.solved,
							color: colorPalette.ocean.dark,
						},
						{
							title: 'Unique Receivers',
							name: 'dailyUniqueReceivers',
							amount: sum.dailyUniqueReceivers,
							color: colorPalette.error.light,
						},
						{
							title: 'Unique Senders',
							name: 'dailyUniqueSenders',
							amount: sum.dailyUniqueSenders,
							color: colorPalette.success.main,
						},
					]}
				/>
			</Card>
		</Card>
	);
};
