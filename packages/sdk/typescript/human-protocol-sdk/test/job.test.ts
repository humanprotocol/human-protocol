import { getPublicURL } from './../src/storage';
import { EscrowStatus, Job } from '../src';
import { upload } from '../src/storage';
import { toFullDigit } from '../src/utils';
import {
  DEFAULT_GAS_PAYER_ADDR,
  DEFAULT_GAS_PAYER_PRIVKEY,
  DEFAULT_HMTOKEN_ADDR,
  DEFAULT_STAKING_ADDR,
  NOT_TRUSTED_OPERATOR_PRIVKEY,
  REPUTATION_ORACLE_PRIVKEY,
  TRUSTED_OPERATOR1_ADDR,
  TRUSTED_OPERATOR1_PRIVKEY,
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

const setupJob = async (job: Job) => {
  await job.initialize();
  await job.launch();
  await job.setup();
};

describe('Test Job', () => {
  describe('New job', () => {
    let job: Job;

    beforeEach(() => {
      job = new Job({
        gasPayer: DEFAULT_GAS_PAYER_PRIVKEY,
        reputationOracle: REPUTATION_ORACLE_PRIVKEY,
        manifest: manifest,
        hmTokenAddr: DEFAULT_HMTOKEN_ADDR,
        stakingAddr: DEFAULT_STAKING_ADDR,
        logLevel: 'debug',
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

    it('Should be able to launch the job after staking', async () => {
      expect(await job.initialize()).toBe(true);
      expect(await job.launch()).toBe(false);

      await job.stake(1);

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
      await setupJob(job);

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
      await setupJob(job);

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
      await setupJob(job);

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
      await setupJob(job);

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
      await setupJob(job);

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
      await setupJob(job);

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
      await setupJob(job);

      expect(await job.abort()).toBe(true);
    });

    it('Should be able to abort partially paid job', async () => {
      await setupJob(job);

      const finalResults = { results: 0 };
      await job.bulkPayout(
        [
          {
            address: WORKER1_ADDR,
            amount: 50,
          },
        ],
        finalResults,
        true
      );

      expect(await job.abort()).toBe(true);
    });

    it('Should not be able to abort fully paid job', async () => {
      await setupJob(job);

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

      expect(await job.abort()).toBe(false);
    });

    it('Should be able to cancel the job', async () => {
      await setupJob(job);

      expect(await job.cancel()).toBe(true);
      expect((await job.balance())?.toString()).toBe(toFullDigit(0).toString());
    });

    it('Should be able to cancel partially paid job', async () => {
      await setupJob(job);

      const finalResults = { results: 0 };
      await job.bulkPayout(
        [
          {
            address: WORKER1_ADDR,
            amount: 50,
          },
        ],
        finalResults,
        true
      );

      expect(await job.cancel()).toBe(true);
      expect((await job.balance())?.toString()).toBe(toFullDigit(0).toString());
    });

    it('Should not be able to cancel paid job', async () => {
      await setupJob(job);

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

      expect(await job.cancel()).toBe(false);
    });

    it('Should be able to allocate token to the job', async () => {
      await job.initialize();

      expect(await job.launch()).toBe(true);
      expect(await job.status()).toBe(EscrowStatus.Launched);

      expect(await job.allocate(1)).toBe(true);
    });

    it('Should be able to launch another job after allocating portion of the stake', async () => {
      await job.initialize();
      await job.stake(2);

      expect(await job.launch()).toBe(true);
      expect(await job.status()).toBe(EscrowStatus.Launched);

      expect(await job.allocate(1)).toBe(true);

      const newJob = new Job({
        gasPayer: DEFAULT_GAS_PAYER_PRIVKEY,
        reputationOracle: REPUTATION_ORACLE_PRIVKEY,
        manifest: manifest,
        hmTokenAddr: DEFAULT_HMTOKEN_ADDR,
        stakingAddr: DEFAULT_STAKING_ADDR,
        logLevel: 'error',
      });

      await newJob.initialize();
      expect(await newJob.launch()).toBe(true);
    });

    it('Should not be able to launch another job after allocating all of the stake', async () => {
      await job.initialize();

      expect(await job.launch()).toBe(true);
      expect(await job.status()).toBe(EscrowStatus.Launched);

      expect(await job.allocate(1)).toBe(true);

      const newJob = new Job({
        gasPayer: DEFAULT_GAS_PAYER_PRIVKEY,
        reputationOracle: REPUTATION_ORACLE_PRIVKEY,
        manifest: manifest,
        hmTokenAddr: DEFAULT_HMTOKEN_ADDR,
        stakingAddr: DEFAULT_STAKING_ADDR,
        logLevel: 'error',
      });

      await newJob.initialize();
      expect(await newJob.launch()).toBe(false);
    });

    it('Should be able to launch another job after staking more tokens', async () => {
      await job.initialize();
      await job.stake(1);

      expect(await job.launch()).toBe(true);
      expect(await job.status()).toBe(EscrowStatus.Launched);

      expect(await job.allocate(1)).toBe(true);

      const newJob = new Job({
        gasPayer: DEFAULT_GAS_PAYER_PRIVKEY,
        reputationOracle: REPUTATION_ORACLE_PRIVKEY,
        manifest: manifest,
        hmTokenAddr: DEFAULT_HMTOKEN_ADDR,
        stakingAddr: DEFAULT_STAKING_ADDR,
        logLevel: 'error',
      });

      await newJob.initialize();
      await newJob.stake(1);
      expect(await newJob.launch()).toBe(true);
    });
  });

  describe('Access existing job from trusted handler', () => {
    let job: Job;

    beforeEach(async () => {
      const originalJob = new Job({
        gasPayer: DEFAULT_GAS_PAYER_PRIVKEY,
        reputationOracle: REPUTATION_ORACLE_PRIVKEY,
        manifest: manifest,
        hmTokenAddr: DEFAULT_HMTOKEN_ADDR,
        stakingAddr: DEFAULT_STAKING_ADDR,
        trustedHandlers: [TRUSTED_OPERATOR1_PRIVKEY],
        logLevel: 'error',
      });

      await originalJob.initialize();
      await originalJob.launch();
      await originalJob.stake(1);
      await originalJob.setup();

      job = new Job({
        gasPayer: NOT_TRUSTED_OPERATOR_PRIVKEY,
        hmTokenAddr: DEFAULT_HMTOKEN_ADDR,
        reputationOracle: REPUTATION_ORACLE_PRIVKEY,
        escrowAddr: originalJob.contractData?.escrowAddr,
        factoryAddr: originalJob.contractData?.factoryAddr,
        trustedHandlers: [TRUSTED_OPERATOR1_PRIVKEY],
        logLevel: 'error',
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('Should be able to initializes the job by accessing existing escrow', async () => {
      expect(await job.initialize()).toBe(true);

      expect(await job.manifestData?.manifestlink?.url).toBe('uploaded-key');
      expect(await job.manifestData?.manifestlink?.hash).toBe('uploaded-hash');
    });

    it('Should not be able to launch the job again', async () => {
      await job.initialize();

      expect(await job.launch()).toBe(false);
      expect(await job.status()).toBe(EscrowStatus.Pending);
    });

    it('Should not be able to setup the job again', async () => {
      await job.initialize();

      expect(await job.setup()).toBe(false);

      expect((await job.balance())?.toString()).toBe(
        toFullDigit(100).toString()
      );
      expect(await job.manifestData?.manifestlink?.url).toBe('uploaded-key');
      expect(await job.manifestData?.manifestlink?.hash).toBe('uploaded-hash');
    });

    it('Should be able to add trusted handlers', async () => {
      await job.initialize();

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

      expect(await job.abort()).toBe(true);
    });

    it('Should be able to abort partially paid job', async () => {
      await job.initialize();

      const finalResults = { results: 0 };
      await job.bulkPayout(
        [
          {
            address: WORKER1_ADDR,
            amount: 50,
          },
        ],
        finalResults,
        true
      );

      expect(await job.abort()).toBe(true);
    });

    it('Should not be able to abort fully paid job', async () => {
      await job.initialize();

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

      expect(await job.abort()).toBe(false);
    });

    it('Should be able to cancel the job', async () => {
      await job.initialize();

      expect(await job.cancel()).toBe(true);
      expect((await job.balance())?.toString()).toBe(toFullDigit(0).toString());
    });

    it('Should be able to cancel partially paid job', async () => {
      await job.initialize();

      const finalResults = { results: 0 };
      await job.bulkPayout(
        [
          {
            address: WORKER1_ADDR,
            amount: 50,
          },
        ],
        finalResults,
        true
      );

      expect(await job.cancel()).toBe(true);
      expect((await job.balance())?.toString()).toBe(toFullDigit(0).toString());
    });

    it('Should not be able to cancel paid job', async () => {
      await job.initialize();

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

      expect(await job.cancel()).toBe(false);
    });

    it('Should not be able to allocate to job without staking', async () => {
      await job.initialize();
      expect(await job.allocate(1, TRUSTED_OPERATOR1_ADDR)).toBe(false);
    });

    it('Should be able to allocate to job after staking', async () => {
      await job.initialize();
      await job.stake(1, TRUSTED_OPERATOR1_ADDR);

      expect(await job.allocate(1, TRUSTED_OPERATOR1_ADDR)).toBe(true);
    });

    it('Should be able to launch another job after staking', async () => {
      await job.initialize();
      await job.stake(1, TRUSTED_OPERATOR1_ADDR);

      const newJob = new Job({
        gasPayer: TRUSTED_OPERATOR1_PRIVKEY,
        reputationOracle: REPUTATION_ORACLE_PRIVKEY,
        manifest: manifest,
        hmTokenAddr: DEFAULT_HMTOKEN_ADDR,
        stakingAddr: DEFAULT_STAKING_ADDR,
        logLevel: 'error',
      });

      await newJob.initialize();
      expect(await newJob.launch()).toBe(true);
    });
  });
});
