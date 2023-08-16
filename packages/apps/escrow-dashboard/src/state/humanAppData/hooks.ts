import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { AppState, useAppDispatch } from '..';
import { fetchEventDayDatas } from './reducer';

export const useHumanAppData = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchEventDayDatas());
  }, [dispatch]);
};

export const useChainId = () => {
  const { chainId } = useSelector((state: AppState) => state.humanAppData);
  return chainId;
};

export const useHumanAppDataByChainId = () => {
  const { humanAppData } = useSelector((state: AppState) => state);
  const { eventDayDatas, chainId, days } = humanAppData;

  return eventDayDatas[chainId]?.slice(0, days) ?? [];
};

export const useHumanAppDataLoaded = () => {
  const humanAppData = useSelector((state: AppState) => state.humanAppData);

  return humanAppData.eventDayDatasLoaded;
};
