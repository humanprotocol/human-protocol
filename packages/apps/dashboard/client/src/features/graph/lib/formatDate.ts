import dayjs from 'dayjs';

const formatDate = (date: string, dateFormat?: string) => {
  return dayjs(new Date(date)).format(dateFormat ?? 'dd/MM/yyyy');
};

export default formatDate;
