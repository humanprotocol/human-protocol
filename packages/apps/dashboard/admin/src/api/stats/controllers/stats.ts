/**
 * A set of functions called "actions" for `stats`
 */

export default {
  getTasksStats: async (ctx, next) => {
    try {
      const service = strapi.service('api::stats.stats') as any;
      const data = await service.getTasksStats(ctx.query);
      ctx.body = data;
    } catch (err) {
      ctx.body = err;
    }
  },
  getWorkersStats: async (ctx, next) => {
    try {
      const service = strapi.service('api::stats.stats') as any;
      const data = await service.getWorkersStats(ctx.query);
      ctx.body = data;
    } catch (err) {
      ctx.body = err;
    }
  },
};
