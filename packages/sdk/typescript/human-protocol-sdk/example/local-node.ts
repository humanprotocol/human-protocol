import { Wallet, ethers } from 'ethers';
import { setTimeout } from 'timers/promises';

import { ChainId } from '../src/enums';
import { KVStoreClient, KVStoreUtils } from '../src/kvstore';

const LOCALHOST_RPC_URL = 'http://localhost:8545';

/**
 * Default is last signer account of local hardhat node.
 */
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  '0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e';

const CREATED_AT_KV_KEY = 'created_at';
const UPDATED_AT_KV_KEY = 'last_touched_at';
const TOUCHED_TIMES_KV_KEY = 'touches_count';

const run = async () => {
  const provider = new ethers.JsonRpcProvider(LOCALHOST_RPC_URL);
  const wallet = new Wallet(PRIVATE_KEY, provider);

  const walletAddress = wallet.address;
  console.log(`Wallet address: ${walletAddress}`);

  const kvStoreClient = await KVStoreClient.build(wallet);
  const currentDate = new Date().toISOString();

  const existingKeys = await KVStoreUtils.getKVStoreData(
    ChainId.LOCALHOST,
    walletAddress
  );

  if (existingKeys.length === 0) {
    console.log('No KV data; initializing');
    await kvStoreClient.setBulk(
      [CREATED_AT_KV_KEY, TOUCHED_TIMES_KV_KEY],
      [currentDate, '0']
    );
  } else {
    console.log('KV data found; updating');
    const touchedTimesData = existingKeys.find(
      (d) => d.key === TOUCHED_TIMES_KV_KEY
    ) || { value: '0' };

    let touchedTimes = Number(touchedTimesData.value);

    if (!Number.isSafeInteger(touchedTimes)) {
      touchedTimes = 0;
    }
    touchedTimes += 1;

    await kvStoreClient.setBulk(
      [UPDATED_AT_KV_KEY, TOUCHED_TIMES_KV_KEY],
      [currentDate, touchedTimes.toString()]
    );
  }

  console.log('Finished setting values in KV store. Wait and read');
  /**
   * Usually data is indexed almost immediately on local subgraph,
   * but there might be a delay if machine is slow or loaded,
   * so adding small delay here as well just in case.
   */
  await setTimeout(1000 * 2);

  const kvData = await KVStoreUtils.getKVStoreData(
    ChainId.LOCALHOST,
    walletAddress
  );
  console.log('Final KV store data:', kvData);
};

(async () => {
  try {
    await run();
    process.exit(0);
  } catch (error) {
    console.log('Failed', error);
    process.exit(1);
  }
})();
