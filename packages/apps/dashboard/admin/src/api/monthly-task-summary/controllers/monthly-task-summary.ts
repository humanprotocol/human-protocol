/**
 * monthly-task-summary controller
 */

import { factories } from '@strapi/strapi';
import axios from 'axios';
import dayjs from 'dayjs';

export default factories.createCoreController('api::monthly-task-summary.monthly-task-summary', ({ strapi }) => ({
  async syncTaskSummary(ctx) {
    const uid = 'api::monthly-task-summary.monthly-task-summary';
    const entries = await strapi.entityService.findMany(uid);

    let startDate = dayjs('2022-07-01');
    const currentDate = dayjs().subtract(1, 'month').endOf('month');
    const dates = [];

    while (startDate <= currentDate) {
      const from = startDate.startOf('month').format('YYYY-MM-DD');
      const to = startDate.endOf('month').format('YYYY-MM-DD');

      const entry = entries.find((e) => e.date === to);
      if (!entry) {
        dates.push({ from, to });
      }

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
          .then((res) => res.data)
      )
    );

    const entriesToCreate = results.map((r, i) => ({
      date: dates[i].to,
      served_count: r.total.served,
      solved_count: r.total.solved,
    }));

    if (entriesToCreate.length > 0) {
      await strapi.db.query(uid).createMany({ data: entriesToCreate });
    }

    ctx.body = entriesToCreate;
  },
}));
