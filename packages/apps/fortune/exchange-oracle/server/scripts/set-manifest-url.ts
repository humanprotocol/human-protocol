import { EscrowClient } from "@human-protocol/sdk";

import { Client } from 'pg';
import { ethers } from 'ethers';

const dbConfig = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: +process.env.POSTGRES_PORT!,
};

async function createSigner() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.WEB3_PRIVATE_KEY!);
  return wallet.connect(provider);
}

async function updateJobsWithManifestUrls() {
  const client = new Client(dbConfig);

  try {
    await client.connect();

    const signer = await createSigner();
    const escrowClient = await EscrowClient.build(signer);
    
    console.log('Connected to the database.');

    const res = await client.query('SELECT * FROM "hmt"."jobs" WHERE manifest_url IS NULL');
    const jobsWithoutManifest = res.rows;

    for (const job of jobsWithoutManifest) {
      const { escrow_address: escrowAddress, id } = job;

      try {
        const manifestUrl = await escrowClient.getManifestUrl(escrowAddress);

        if (manifestUrl) {
          await client.query('UPDATE "hmt"."jobs" SET manifest_url = $1 WHERE id = $2', [manifestUrl, id]);
          console.log(`Updated job ${id} with manifestUrl: ${manifestUrl}`);
        }
      } catch (error) {
        console.error(`Failed to update job ${id}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to update manifest URLs:', error);
  } finally {
    await client.end();
    console.log('Disconnected from the database.');
  }
}

updateJobsWithManifestUrls();
