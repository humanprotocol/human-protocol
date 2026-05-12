import { faker } from '@faker-js/faker';
import { ChainId } from '@human-protocol/sdk';
import { EscrowFundToken, FortuneJobType } from '../../common/enums/job';
import { PaymentCurrency } from '../../common/enums/payment';
import { createMockFortuneManifest } from '../manifest/fixtures';
import { JobManifestDto } from './job.dto';
import { JobEntity } from './job.entity';
import { JobStatus } from '../../common/enums/job';

// DISABLE HMT
const paymentCurrencies = (
  Object.values(PaymentCurrency) as PaymentCurrency[]
).filter((c) => c !== PaymentCurrency.HMT);
const escrowFundTokens = (
  Object.values(EscrowFundToken) as EscrowFundToken[]
).filter((c) => c !== EscrowFundToken.HMT);

export const createJobManifestDto = (overrides = {}): JobManifestDto => ({
  chainId: ChainId.POLYGON_AMOY,
  requestType: FortuneJobType.FORTUNE,
  manifest: createMockFortuneManifest(),
  paymentAmount: faker.number.float({ min: 1, max: 100, fractionDigits: 6 }),
  paymentCurrency: faker.helpers.arrayElement(paymentCurrencies),
  escrowFundToken: faker.helpers.arrayElement(escrowFundTokens),
  exchangeOracle: faker.finance.ethereumAddress(),
  recordingOracle: faker.finance.ethereumAddress(),
  reputationOracle: faker.finance.ethereumAddress(),
  ...overrides,
});

export const createJobEntity = (
  overrides: Partial<JobEntity> = {},
): JobEntity => {
  const entity = new JobEntity();
  entity.id = faker.number.int();
  entity.chainId = ChainId.POLYGON_AMOY;
  entity.reputationOracle = faker.finance.ethereumAddress();
  entity.exchangeOracle = faker.finance.ethereumAddress();
  entity.recordingOracle = faker.finance.ethereumAddress();
  entity.escrowAddress = faker.finance.ethereumAddress();
  entity.fee = faker.number.float({ min: 0.01, max: 1, fractionDigits: 6 });
  entity.fundAmount = faker.number.float({
    min: 1,
    max: 1000,
    fractionDigits: 6,
  });
  entity.token = faker.helpers.arrayElement([
    EscrowFundToken.HMT,
    EscrowFundToken.USDC,
  ]) as EscrowFundToken;
  entity.manifestUrl = faker.internet.url();
  entity.manifestHash = faker.string.uuid();
  entity.failedReason = null;
  entity.requestType = FortuneJobType.FORTUNE;
  entity.status = faker.helpers.arrayElement(Object.values(JobStatus));
  entity.userId = faker.number.int();
  entity.payments = [];
  entity.retriesCount = faker.number.int({ min: 0, max: 4 });
  entity.waitUntil = faker.date.future();
  Object.assign(entity, overrides);
  return entity;
};
