import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import SmallGraph from '@components/Home/SmallGraph';
import 'swiper/css';
import 'swiper/css/navigation';

const firstGraphData = [
	{
		name: '2024-01-01',
		value: 3000000,
	},
	{
		name: '2024-01-02',
		value: 4000000,
	},
	{
		name: '2024-01-03',
		value: 5000000,
	},
];

const GraphSwiper = () => {
	return (
		<Swiper
			loop={true}
			navigation={true}
			modules={[Navigation]}
			className="mySwiper"
		>
			<SwiperSlide>
				<SmallGraph graphData={firstGraphData} title="Transaction history" />
			</SwiperSlide>
			<SwiperSlide>
				<SmallGraph graphData={firstGraphData} title="Transaction history 2" />
			</SwiperSlide>
			<SwiperSlide>
				<SmallGraph graphData={firstGraphData} title="Transaction history 3" />
			</SwiperSlide>
		</Swiper>
	);
};

export default GraphSwiper;
