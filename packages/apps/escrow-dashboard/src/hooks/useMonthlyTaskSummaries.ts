import axios from 'axios';
import useSWR from 'swr';

export function useMonthlyTaskSummaries() {
  return useSWR(`human-protocol-dashboard-monthly-task-summaries`, async () => {
    const apiURL = import.meta.env.VITE_APP_ADMIN_API_URL;
    const { data } = await axios.get(`${apiURL}/monthly-task-summaries`);

    return data.data.map((item: any) => ({
      date: item.attributes.date,
      value: item.attributes.solved_count,
    }));
  });
}
