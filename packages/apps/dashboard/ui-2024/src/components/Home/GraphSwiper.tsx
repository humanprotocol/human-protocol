import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import SmallGraph from '@components/Home/SmallGraph';
import 'swiper/css';
import 'swiper/css/navigation';
import { useGraphPageChartData } from '@services/api/use-graph-page-chart-data';

const GraphSwiper = () => {
	const { data } = useGraphPageChartData();
	const transactionHistoryData = (data || []).map(
		({ totalTransactionCount, date }) => ({
			value: totalTransactionCount,
			date,
		})
	);
	const transferAmount = (data || []).map(
		({ totalTransactionAmount, date }) => ({
			value: totalTransactionAmount,
			date,
		})
	);
	const solvedTasks = (data || []).map(({ solved, date }) => ({
		value: solved,
		date,
	}));

	const uniqueSenders = (data || []).map(({ dailyUniqueSenders, date }) => ({
		value: dailyUniqueSenders,
		date,
	}));

	const uniqueReceivers = (data || []).map(
		({ dailyUniqueReceivers, date }) => ({
			value: dailyUniqueReceivers,
			date,
		})
	);

	return (
		<Swiper
			loop={true}
			navigation={true}
			modules={[Navigation]}
			className="mySwiper"
		>
			<SwiperSlide>
				<SmallGraph
					graphData={transactionHistoryData}
					title="Transaction history"
				/>
			</SwiperSlide>
			<SwiperSlide>
				<SmallGraph graphData={transferAmount} title="Transfer Amount" />
			</SwiperSlide>
			<SwiperSlide>
				<SmallGraph graphData={solvedTasks} title="Number of Tasks" />
			</SwiperSlide>
			<SwiperSlide>
				<SmallGraph graphData={uniqueSenders} title="Unique Senders" />
			</SwiperSlide>
			<SwiperSlide>
				<SmallGraph graphData={uniqueReceivers} title="Unique Receivers" />
			</SwiperSlide>
		</Swiper>
	);
};

export default GraphSwiper;
