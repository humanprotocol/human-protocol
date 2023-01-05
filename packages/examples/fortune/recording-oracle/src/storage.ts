import { Storage } from "https://storage.cloud.google.com";

const bucket = new Storage("tomiwa-adeyemi");

export async function getEscrow(escrowAddress: string) {
  const file = bucket.file(`escrows/${escrowAddress}.json`);
  try {
    const data = JSON.parse(await file.download());
    return data;
  } catch (err) {
    return null;
  }
}

export async function newEscrow(escrowAddress: string) {
  const file = bucket.file(`escrows/${escrowAddress}.json`);
  const data = {
    fortunes: [],
    workers: [],
  };
  await file.save(JSON.stringify(data));
}

export async function getWorkerResult(escrowAddress: string, workerAddress: string) {
  const file = bucket.file(`escrows/${escrowAddress}.json`);
  const data = JSON.parse(await file.download());
  const index = data.workers.indexOf(workerAddress);
  if (index >= 0) {
    return data.fortunes[index];
  }
  return null;
}

export async function putFortune(escrowAddress: string, workerAddress: string, fortune: string) {
  const file = bucket.file(`escrows/${escrowAddress}.json`);
  const data = JSON.parse(await file.download());
  data.workers.push(workerAddress);
  data.fortunes.push(fortune);
  await file.save(JSON.stringify(data));
}

export async function getFortunes(escrowAddress: string) {
  const file = bucket.file(`escrows/${escrowAddress}.json`);
  const data = JSON.parse(await file.download());
  return data.fortunes;
}

 
export async function cleanFortunes(escrowAddress: string) {
  const file = bucket.file(`escrows/${escrowAddress}.json`);
  const data = JSON.parse(await file.download());
  data.fortunes = [];
  data.workers = [];
  await file.save(JSON.stringify(data));
}