import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	TooltipProps,
} from 'recharts';
import Card from '@mui/material/Card';
import { colorPalette } from '@assets/styles/color-palette';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import ToggleButtons from '@components/DataEntry/ToggleButtons';
import { Fragment } from 'react';
import { formatDate } from '@helpers/formatDate';
import { formatNumber } from '@helpers/formatNumber';

const CustomSmallChartTooltip = ({
	payload,
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
					{payload?.map((elem) => (
						<Fragment key={elem.name}>
							<Typography fontWeight={500} variant="caption">
								{formatDate(elem.payload.date, 'MMMM DD, YYYY')}
							</Typography>
							<Typography fontWeight={500} variant="h6" component="p">
								{elem.value ? elem.value.toLocaleString('en-US') : ''}
							</Typography>
						</Fragment>
					))}
				</Box>
			</Card>
		);
	}
	return null;
};

interface SmallGraphProps {
	graphData: {
		date: string;
		value: number;
	}[];
	title: string;
}

const SmallGraph = ({ title, graphData }: SmallGraphProps) => {
	return (
		<>
			<ResponsiveContainer height={150}>
				<AreaChart
					data={graphData}
					margin={{
						top: 5,
						right: 50,
						left: 0,
					}}
				>
					<defs>
						<linearGradient id="value" x1="0" y1="0" x2="0" y2="1">
							<stop offset={'90%'} stopColor="#244CB20F" stopOpacity={0.9} />
							<stop offset={'100%'} stopColor="#B4C2E505" stopOpacity={0} />
						</linearGradient>
					</defs>
					<XAxis
						style={{
							fontSize: 10,
							fontWeight: 500,
						}}
						axisLine={false}
						interval="preserveStartEnd"
						dataKey="date"
						stroke={colorPalette.fog.main}
						tickFormatter={(value) => formatDate(value, 'DD MMMM')}
						tick={{ dy: 10 }}
						tickSize={0}
					/>
					<YAxis
						style={{
							fontSize: 10,
							fontWeight: 500,
						}}
						axisLine={false}
						dataKey="value"
						tick={{ dx: -10 }}
						tickSize={0}
						stroke={colorPalette.fog.main}
						tickFormatter={formatNumber}
					/>
					<CartesianGrid stroke="#ccc" strokeDasharray="7" vertical={false} />
					<Tooltip content={<CustomSmallChartTooltip />} />
					<Area
						type="monotone"
						dataKey="value"
						stroke={colorPalette.primary.main}
						fill="url(#value)"
					/>
				</AreaChart>
			</ResponsiveContainer>
			<Stack
				sx={{
					marginTop: 2,
				}}
				direction={{ xs: 'column', xl: 'row' }}
				justifyContent="center"
				alignItems="center"
				gap={2}
			>
				<Typography fontWeight={400} variant="h6" component="p">
					{title}
				</Typography>
				<ToggleButtons />
			</Stack>
		</>
	);
};

export default SmallGraph;
