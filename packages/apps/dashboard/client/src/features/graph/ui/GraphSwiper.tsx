import { FC, useEffect } from 'react';

import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/navigation';

import useChartData from '../api/useChartData';
import useChartParamsStore from '../store/useChartParamsStore';

import SmallGraph from './SmallGraph';

const GraphSwiper: FC = () => {
  const {
    revertToInitialParams,
    dateRangeParams: { from, to },
  } = useChartParamsStore();
  const { data } = useChartData(from, to);

  useEffect(() => {
    revertToInitialParams();
  }, [revertToInitialParams]);

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
