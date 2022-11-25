import { getPublicURL } from './../src/storage';
import { EscrowStatus, Job } from '../src';
import { upload } from '../src/storage';
import { toFullDigit } from '../src/utils';
import {
  DEFAULT_GAS_PAYER_ADDR,
  DEFAULT_GAS_PAYER_PRIVKEY,
  DEFAULT_HMTOKEN_ADDR,
  REPUTATION_ORACLE_PRIVKEY,
  TRUSTED_OPERATOR1_ADDR,
  TRUSTED_OPERATOR2_ADDR,
  WORKER1_ADDR,
  WORKER2_ADDR,
  WORKER3_ADDR,
} from './utils/constants';
import { manifest } from './utils/manifest';

jest.mock('../src/storage', () => ({
  ...jest.requireActual('../src/storage'),
  upload: jest.fn().mockResolvedValue({
    key: 'uploaded-key',
    hash: 'uploaded-hash',
  }),
  download: jest.fn().mockResolvedValue({
    results: 0,
  }),
  getPublicURL: jest.fn().mockResolvedValue('public-url'),
}));

describe('Test Job', () => {
  describe('New job', () => {
    let job: Job;

    beforeEach(() => {
      job = new Job({
        gasPayer: DEFAULT_GAS_PAYER_PRIVKEY,
        reputationOracle: REPUTATION_ORACLE_PRIVKEY,
        manifest: manifest,
        hmTokenAddr: DEFAULT_HMTOKEN_ADDR,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('Should be able to initializes the job by deploying escrow factory', async () => {
      const initialized = await job.initialize();
      expect(initialized).toBe(true);

      expect(await job.contractData?.factory?.address).not.toBeNull();
    });

    it('Should be able to launch the job', async () => {
      // Fail to launch the job before initialization
      expect(await job.launch()).toBe(false);

      await job.initialize();

      expect(await job.launch()).toBe(true);
      expect(await job.status()).toBe(EscrowStatus.Launched);
    });

    it('Should be able to setup the job', async () => {
      // Fail to setup the job before launch
      expect(await job.setup()).toBe(false);

      await job.initialize();
      await job.launch();

      expect(await job.setup()).toBe(true);
    });

    it('Should be able to add trusted handlers', async () => {
      await job.initialize();
      await job.launch();

      expect(await job.isTrustedHandler(DEFAULT_GAS_PAYER_ADDR)).toBe(true);

      expect(
        await job.addTrustedHandlers([
          TRUSTED_OPERATOR1_ADDR,
          TRUSTED_OPERATOR2_ADDR,
        ])
      ).toBe(true);

      expect(await job.isTrustedHandler(TRUSTED_OPERATOR1_ADDR)).toBe(true);
      expect(await job.isTrustedHandler(TRUSTED_OPERATOR2_ADDR)).toBe(true);
    });

    it('Should be able to bulk payout workers', async () => {
      await job.initialize();
      await job.launch();
      await job.setup();

      expect(
        await job.bulkPayout(
          [
            {
              address: WORKER1_ADDR,
              amount: 20,
            },
            {
              address: WORKER2_ADDR,
              amount: 50,
            },
          ],
          {}
        )
      ).toBe(true);

      // The escrow contract is still in Partial state as there's still balance left.
      expect((await job.balance())?.toString()).toBe(
        toFullDigit(30).toString()
      );
      expect(await job.status()).toBe(EscrowStatus.Partial);

      // Trying to pay more than the contract balance results in failure.
      expect(
        await job.bulkPayout(
          [
            {
              address: WORKER3_ADDR,
              amount: 50,
            },
          ],
          {}
        )
      ).toBe(false);

      // Paying the remaining amount empties the escrow and updates the status correctly.
      expect(
        await job.bulkPayout(
          [
            {
              address: WORKER3_ADDR,
              amount: 30,
            },
          ],
          {}
        )
      ).toBe(true);
      expect((await job.balance())?.toString()).toBe(toFullDigit(0).toString());
      expect(await job.status()).toBe(EscrowStatus.Paid);
    });

    it('Should encrypt result, when bulk paying out workers', async () => {
      await job.initialize();
      await job.launch();
      await job.setup();

      jest.clearAllMocks();
      const finalResults = { results: 0 };
      await job.bulkPayout(
        [
          {
            address: WORKER1_ADDR,
            amount: 100,
          },
        ],
        finalResults,
        true
      );

      expect(upload).toHaveBeenCalledWith(
        job.storageAccessData,
        finalResults,
        job.providerData?.reputationOracle?.publicKey,
        true,
        false
      );
      expect(upload).toHaveBeenCalledTimes(1);
    });

    it('Should not encrypt result, when bulk paying out workers', async () => {
      await job.initialize();
      await job.launch();
      await job.setup();

      jest.clearAllMocks();
      const finalResults = { results: 0 };
      await job.bulkPayout(
        [
          {
            address: WORKER1_ADDR,
            amount: 100,
          },
        ],
        finalResults,
        false
      );

      expect(upload).toHaveBeenCalledWith(
        job.storageAccessData,
        finalResults,
        job.providerData?.reputationOracle?.publicKey,
        false,
        false
      );
      expect(upload).toHaveBeenCalledTimes(1);
    });

    it('Should store result in private storage, when bulk paying out workers', async () => {
      await job.initialize();
      await job.launch();
      await job.setup();

      jest.clearAllMocks();
      const finalResults = { results: 0 };
      await job.bulkPayout(
        [
          {
            address: WORKER1_ADDR,
            amount: 100,
          },
        ],
        finalResults,
        false,
        false
      );

      expect(upload).toHaveBeenCalledWith(
        job.storageAccessData,
        finalResults,
        job.providerData?.reputationOracle?.publicKey,
        false,
        false
      );
      expect(upload).toHaveBeenCalledTimes(1);
    });

    it('Should store result in public storage, when bulk paying out workers', async () => {
      await job.initialize();
      await job.launch();
      await job.setup();

      jest.clearAllMocks();
      const finalResults = { results: 0 };
      await job.bulkPayout(
        [
          {
            address: WORKER1_ADDR,
            amount: 50,
          },
        ],
        finalResults,
        false,
        true
      );

      expect(upload).toHaveBeenCalledWith(
        job.storageAccessData,
        finalResults,
        job.providerData?.reputationOracle?.publicKey,
        false,
        true
      );
      expect(upload).toHaveBeenCalledTimes(1);
      expect(getPublicURL).toHaveBeenCalledTimes(1);
    });

    it('Should return final result', async () => {
      await job.initialize();
      await job.launch();
      await job.setup();

      const finalResults = { results: 0 };
      await job.bulkPayout(
        [
          {
            address: WORKER1_ADDR,
            amount: 100,
          },
        ],
        finalResults,
        true
      );

      expect(JSON.stringify(await job.finalResults())).toBe(
        JSON.stringify(finalResults)
      );
    });

    it('Should be able to abort the job', async () => {
      await job.initialize();
      await job.launch();
      await job.setup();

      expect(await job.abort()).toBe(true);
    });
  });
});
