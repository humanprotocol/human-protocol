/**
 * daily-task-summary controller
 */

import { factories } from '@strapi/strapi';
import axios from 'axios';
import dayjs from 'dayjs';

export default factories.createCoreController('api::daily-task-summary.daily-task-summary', ({ strapi }) => ({
  async syncPreviousData(ctx) {
    const uid = 'api::daily-task-summary.daily-task-summary';

    let startDate = dayjs('2022-07-01');
    const currentDate = dayjs();
    const dates = [];

    while (startDate <= currentDate) {
      const from = startDate.startOf('month').format('YYYY-MM-DD');
      const to = startDate.endOf('month').format('YYYY-MM-DD');

      dates.push({ from, to });

      startDate = startDate.add(1, 'month');
    }

    const results = await Promise.all(
      dates.map(({ from, to }) =>
        axios
          .get('/support/summary-stats', {
            baseURL: 'https://foundation-accounts.hmt.ai',
            method: 'GET',
            params: {
              start_date: from,
              end_date: to,
              api_key: process.env.HCAPTCHA_LABELING_STAFF_API_KEY,
            },
          })
          .then((res) => res.data),
      ),
    );

    const entriesToCreate = [];
    results.forEach((result, i) => {
      Object.keys(result).forEach((date) => {
        if (date === 'total') return;
        entriesToCreate.push({
          date,
          served_count: result[date].served,
          solved_count: result[date].solved,
        });
      });
    });

    if (entriesToCreate.length > 0) {
      await strapi.db.query(uid).createMany({ data: entriesToCreate });
    }

    ctx.body = {
      length: entriesToCreate.length,
    };
  },
}));
