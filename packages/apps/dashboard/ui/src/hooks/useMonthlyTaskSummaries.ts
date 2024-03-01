import axios from 'axios';
import dayjs from 'dayjs';
import useSWR from 'swr';

export function useMonthlyTaskSummaries() {
  return useSWR(`human-protocol-dashboard-monthly-task-summaries`, async () => {
    const apiURL = import.meta.env.VITE_APP_ADMIN_API_URL;

    // const from = dayjs().startOf('month').format('YYYY-MM-DD');
    // const to = dayjs().endOf('month').format('YYYY-MM-DD');
    // const [cachedData, thisMonthData] = await Promise.all([
    //   axios
    //     .get(`${apiURL}/monthly-task-summaries?sort=id`)
    //     .then((res) => res.data),
    //   axios
    //     .get(`${apiURL}/stats/tasks?to=${to}&from=${from}`)
    //     .then((res) => res.data),
    // ]);
    let cachedData, thisMonthData;
    try {
      cachedData = (await axios.get(`${apiURL}/monthly-task-summaries?sort=id`))
        .data;
      thisMonthData = { dailyTasksData: [] };
    } catch (error) {
      cachedData = { data: [] };
      thisMonthData = { dailyTasksData: [] };
    }

    const totalSolvedTasks = thisMonthData.dailyTasksData.reduce(
      (a: number, b: any) => a + b.tasksSolved,
      0
    );

    cachedData.data.push({
      id: cachedData.data[cachedData.data.length - 1].id + 1,
      attributes: {
        date: dayjs().format('YYYY-MM-DD'),
        solved_count: totalSolvedTasks,
      },
    });

    return cachedData.data.map((item: any) => {
      const { date, solved_count } = item.attributes;
      const multiplier = date <= '2022-11-30' ? 18 : 9;

      return {
        date,
        value: solved_count * multiplier,
      };
    });
  });
}
