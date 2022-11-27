/* eslint-disable no-console */
import { Job } from '../src';
import {
  DEFAULT_GAS_PAYER_PRIVKEY,
  DEFAULT_HMTOKEN_ADDR,
  REPUTATION_ORACLE_PRIVKEY,
  WORKER1_ADDR,
  WORKER2_ADDR,
} from '../test/utils/constants';
import { manifest } from '../test/utils/manifest';
import * as dotenv from 'dotenv';

dotenv.config();

const main = async () => {
  // Create job object
  const job = new Job({
    gasPayer: DEFAULT_GAS_PAYER_PRIVKEY,
    reputationOracle: REPUTATION_ORACLE_PRIVKEY,
    manifest: manifest,
    hmTokenAddr: DEFAULT_HMTOKEN_ADDR,
    storageAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    storageSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    storageEndpoint: process.env.AWS_ENDPOINT,
    storageBucket: process.env.AWS_BUCKET,
    storagePublicBucket: process.env.AWS_PUBLIC_BUCKET,
    logLevel: 'debug',
  });

  // Initialize new job
  await job.initialize();

  // Launch the job
  await job.launch();

  // Setup the job
  await job.setup();

  console.log(
    `Status: ${await job.status()}, Balance: ${(
      await job.balance()
    )?.toString()}`
  );

  // Bulk payout workers
  await job.bulkPayout(
    [
      {
        address: WORKER1_ADDR,
        amount: 70,
      },
      {
        address: WORKER2_ADDR,
        amount: 30,
      },
    ],
    {
      result: 'result',
    },
    false,
    true
  );

  // Complete the job
  await job.complete();

  console.log(
    `Status: ${await job.status()}, Balance: ${(
      await job.balance()
    )?.toString()}`
  );
};

main();
