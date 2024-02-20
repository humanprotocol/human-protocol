export default {
  routes: [
    {
      method: 'GET',
      path: '/stats/tasks',
      handler: 'stats.getTasksStats',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/stats/workers',
      handler: 'stats.getWorkersStats',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
