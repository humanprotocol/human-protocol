import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import getServer from './server';

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

const startServer = async () => {
  const server = await getServer();
  const port = +server.config.API_PORT;
  const host = server.config.API_HOST;
  await server.listen({ host, port });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () =>
      server.close().then((err) => {
        // eslint-disable-next-line no-console
        console.log(`close application on ${signal}`);
        process.exit(err ? 1 : 0);
      })
    );
  }
};

startServer();
