module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/daily-task-summary/sync-past',
      handler: 'daily-task-summary.syncPreviousData',
    },
  ],
};
