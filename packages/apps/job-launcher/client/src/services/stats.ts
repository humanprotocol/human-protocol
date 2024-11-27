import api from '../utils/api';

export const getStats = async () => {
  const { data } = await api.get<any>(`/statistics`);

  return data;
};
