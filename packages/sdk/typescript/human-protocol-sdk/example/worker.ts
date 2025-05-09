/* eslint-disable no-console */
import { ChainId } from '../src/enums';
import { WorkerUtils } from '../src/worker';

export const getWorkers = async () => {
  const workers = await WorkerUtils.getWorkers({
    chainId: ChainId.POLYGON_AMOY,
    first: 100,
    skip: 0,
  });

  console.log('Filtered workers:', workers);

  const worker = await WorkerUtils.getWorker(
    ChainId.POLYGON_AMOY,
    workers[0].address
  );

  console.log('Worker details:', worker);
};

(async () => {
  await getWorkers();
})();
