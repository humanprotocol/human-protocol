import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import getServer from './server';
import * as Minio from 'minio';
import * as sdk from '@human-protocol/sdk';

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

  const config = {
    port: undefined,
    useSSL: undefined,
  }

  var minioClient = new Minio.Client({
    endPoint: 'localhost',
    ...config,
    accessKey: 'P1RBSbpQu2Fnv6JM',
    secretKey: 'qmlWfZdiqOEVfANoQodHhdSX2Py0r8d2'
  });
  const res2 = await minioClient.presignedUrl('GET', 'launcher', '')
  console.log(res2)
  const res = await minioClient.bucketExists('launcher')
  //const res = await minioClient.listObjects('launcher')
  console.log(res)

  console.info(`API server is running on http://${host}:${port}`);

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
