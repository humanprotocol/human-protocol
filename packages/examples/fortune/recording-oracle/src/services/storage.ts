export interface FortuneEntry {
  worker: string;
  fortune: string;
}

const storage: Record<string, Record<string, string>> = {};

export function newEscrow(address: string) {
  const escrow = {};
  storage[address] = escrow;

  return escrow;
}

export function getEscrow(address: string) {
  return storage[address];
}

export function getWorkerResult(escrowAddress: string, workerAddress: string) {
  return storage[escrowAddress][workerAddress];
}

export function putFortune(
  escrowAddress: string,
  workerAddress: string,
  value: string
) {
  storage[escrowAddress][workerAddress] = value;
}

export function getFortunes(escrowAddress: string) {
  const escrow = storage[escrowAddress];
  const result: FortuneEntry[] = [];
  if (!escrow) {
    return result;
  }

  // eslint-disable-next-line no-restricted-syntax, prefer-const
  for (let workerAddress of Object.keys(escrow)) {
    result.push({ worker: workerAddress, fortune: escrow[workerAddress] });
  }

  return result;
}

export function cleanFortunes(escrowAddress: string) {
  const newEscrow = {};
  storage[escrowAddress] = newEscrow;
}
