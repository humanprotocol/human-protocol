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
};

export const getWorker = async () => {
  const worker = await WorkerUtils.getWorker(
    ChainId.POLYGON_AMOY,
    '0x4163766Cde8410fDDabC4C75a0E2939c55116cC7'
  );

  console.log('Worker details:', worker);
};

(async () => {
  await getWorkers();
  await getWorker();
})();
