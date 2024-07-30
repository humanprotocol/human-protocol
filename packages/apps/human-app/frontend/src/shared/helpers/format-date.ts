import { parseISO, format } from 'date-fns';

export const formatDate = (dateString: string) => {
  const parsedDate = parseISO(dateString);
  return format(parsedDate, 'yyyy-MM-dd');
};
