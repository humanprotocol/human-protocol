import { Qualification } from '../types';
import api from '../utils/api';

export const getQualifications = async () => {
  const { data } = await api.get<Qualification[]>(`/qualification`);
  return data;
};
