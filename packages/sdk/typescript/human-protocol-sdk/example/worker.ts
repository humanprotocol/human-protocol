/* eslint-disable no-console */
import { ChainId, OrderDirection } from '../src/enums';
import { WorkerUtils } from '../src/worker';

export const getWorkers = async () => {
  const workers = await WorkerUtils.getWorkers({
    chainId: ChainId.POLYGON_AMOY,
    first: 100,
    skip: 0,
    orderBy: 'payoutCount',
    orderDirection: OrderDirection.DESC,
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
