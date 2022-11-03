const { expect } = require('@jest/globals');
const {
  newEscrow, getEscrow, putFortune, getWorkerResult, getFortunes, cleanFortunes
} = require('./storage');

describe('Storage', () => {
  const testAddress = '0x0ed2e86fce2e5a7965f59708c01f88a722bc7f07';
  const worker = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';

  it('New escrow', async () => {
    newEscrow(testAddress);
    const escrow = getEscrow(testAddress);
    expect(escrow).toBeDefined();
  });

  it('Save fortune', async () => {
    putFortune(testAddress, worker, 'fortune');
    const escrow = getEscrow(testAddress);
    expect(escrow[worker]).toBe('fortune');
  });

  it('Get worker result', async () => {
    const workerResult = getWorkerResult(testAddress, worker);
    expect(workerResult).toBe('fortune');
  });

  it('Get fortunes', async () => {
    const fortunes = getFortunes(testAddress);
    expect(fortunes).toStrictEqual([{ fortune: 'fortune', worker }]);
  });

  it('Clean fortunes', async () => {
    cleanFortunes(testAddress);
    const fortunes = getFortunes(testAddress);
    expect(fortunes.length).toBe(0);
  });
});
