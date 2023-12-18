module.exports = {
  routes: [
    {
      method: "POST",
      path: "/monthly-task-summary/sync",
      handler: "monthly-task-summary.syncTaskSummary",
    },
  ],
};
