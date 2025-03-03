import dayjs from 'dayjs';

export const formatDate = (date: string, dateFormat?: string) => {
  return dayjs(new Date(date)).format(dateFormat ?? 'dd/MM/yyyy');
};
