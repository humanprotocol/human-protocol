import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import SmallGraph from '@components/Home/SmallGraph';
import 'swiper/css';
import 'swiper/css/navigation';

const GraphSwiper = () => {
	return (
		<Swiper
			loop={true}
			navigation={true}
			modules={[Navigation]}
			className="mySwiper"
		>
			<SwiperSlide>
				<SmallGraph title="Transaction history" />
			</SwiperSlide>
			<SwiperSlide>
				<SmallGraph title="Transaction history 2" />
			</SwiperSlide>
			<SwiperSlide>
				<SmallGraph title="Transaction history 3" />
			</SwiperSlide>
		</Swiper>
	);
};

export default GraphSwiper;
