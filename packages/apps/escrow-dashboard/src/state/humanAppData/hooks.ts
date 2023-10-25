import { useSelector } from 'react-redux';

import { AppState } from '..';

export const useChainId = () => {
  const { chainId } = useSelector((state: AppState) => state.humanAppData);
  return chainId;
};

export const useDays = () => {
  const { days } = useSelector((state: AppState) => state.humanAppData);
  return days;
};
