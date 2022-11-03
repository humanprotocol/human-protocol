const storage = {};

module.exports = {
  newEscrow: (address) => {
    const escrow = {};
    storage[address] = escrow;

    return escrow;
  },

  getEscrow: address => storage[address],

  getWorkerResult: (escrowAddress, workerAddress) => storage[escrowAddress][workerAddress],

  putFortune: (escrowAddress, workerAddress, value) => {
    storage[escrowAddress][workerAddress] = value;
  },

  getFortunes: (escrowAddress) => {
    const escrow = storage[escrowAddress];
    const result = [];
    if (!escrow) {
      return result;
    }

    // eslint-disable-next-line no-restricted-syntax, prefer-const
    for (let workerAddress of Object.keys(escrow)) {
      result.push({ worker: workerAddress, fortune: escrow[workerAddress] });
    }

    return result;
  },

  cleanFortunes: (escrowAddress) => {
    const newEscrow = {};
    storage[escrowAddress] = newEscrow;
  },
};
