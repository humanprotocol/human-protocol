import getServer from './server';

export default async (req: any, res: any) => {
  const server = await getServer();

  server.server.emit('request', req, res);
};
