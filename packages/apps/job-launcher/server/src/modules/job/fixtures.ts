import { faker } from '@faker-js/faker';
import { ChainId } from '@human-protocol/sdk';
import {
  getMockedProvider,
  getMockedRegion,
} from '../../../test/fixtures/storage';
import {
  AudinoJobType,
  CvatJobType,
  EscrowFundToken,
  FortuneJobType,
  JobCaptchaShapeType,
} from '../../common/enums/job';
import { PaymentCurrency } from '../../common/enums/payment';
import {
  JobAudinoDto,
  JobCaptchaDto,
  JobCvatDto,
  JobFortuneDto,
} from './job.dto';
import { JobEntity } from './job.entity';
import { JobStatus } from '../../common/enums/job';

// DISABLE HMT
const paymentCurrencies = (
  Object.values(PaymentCurrency) as PaymentCurrency[]
).filter((c) => c !== PaymentCurrency.HMT);
const escrowFundTokens = (
  Object.values(EscrowFundToken) as EscrowFundToken[]
).filter((c) => c !== EscrowFundToken.HMT);

export const createFortuneJobDto = (overrides = {}): JobFortuneDto => ({
  chainId: ChainId.POLYGON_AMOY,
  submissionsRequired: faker.number.int({ min: 1, max: 10 }),
  requesterTitle: faker.lorem.words(3),
  requesterDescription: faker.lorem.sentence(),
  paymentAmount: faker.number.float({ min: 1, max: 100, fractionDigits: 6 }),
  paymentCurrency: faker.helpers.arrayElement(paymentCurrencies),
  escrowFundToken: faker.helpers.arrayElement(escrowFundTokens),
  exchangeOracle: faker.finance.ethereumAddress(),
  recordingOracle: faker.finance.ethereumAddress(),
  reputationOracle: faker.finance.ethereumAddress(),
  ...overrides,
});

export const createCvatJobDto = (overrides = {}): JobCvatDto => ({
  chainId: ChainId.POLYGON_AMOY,
  data: {
    dataset: {
      provider: getMockedProvider(),
      region: getMockedRegion(),
      bucketName: faker.lorem.word(),
      path: faker.system.filePath(),
    },
  },
  labels: [{ name: faker.lorem.word(), nodes: [faker.string.uuid()] }],
  requesterDescription: faker.lorem.sentence(),
  userGuide: faker.internet.url(),
  minQuality: faker.number.float({ min: 0.1, max: 1 }),
  groundTruth: {
    provider: getMockedProvider(),
    region: getMockedRegion(),
    bucketName: faker.lorem.word(),
    path: faker.system.filePath(),
  },
  type: faker.helpers.arrayElement(Object.values(CvatJobType)),
  paymentCurrency: faker.helpers.arrayElement(paymentCurrencies),
  paymentAmount: faker.number.int({ min: 1, max: 1000 }),
  escrowFundToken: faker.helpers.arrayElement(escrowFundTokens),
  exchangeOracle: faker.finance.ethereumAddress(),
  recordingOracle: faker.finance.ethereumAddress(),
  reputationOracle: faker.finance.ethereumAddress(),
  ...overrides,
});

export const createAudinoJobDto = (overrides = {}): JobAudinoDto => ({
  chainId: ChainId.POLYGON_AMOY,
  data: {
    dataset: {
      provider: getMockedProvider(),
      region: getMockedRegion(),
      bucketName: faker.lorem.word(),
      path: faker.system.filePath(),
    },
  },
  groundTruth: {
    provider: getMockedProvider(),
    region: getMockedRegion(),
    bucketName: faker.lorem.word(),
    path: faker.system.filePath(),
  },
  labels: [{ name: faker.lorem.word() }],
  segmentDuration: faker.number.int({ min: 10, max: 100 }),
  requesterDescription: faker.lorem.sentence(),
  userGuide: faker.internet.url(),
  qualifications: [faker.lorem.word()],
  minQuality: faker.number.int({ min: 1, max: 100 }),
  type: AudinoJobType.AUDIO_TRANSCRIPTION,
  paymentCurrency: faker.helpers.arrayElement(paymentCurrencies),
  paymentAmount: faker.number.int({ min: 1, max: 1000 }),
  escrowFundToken: faker.helpers.arrayElement(escrowFundTokens),
  exchangeOracle: faker.finance.ethereumAddress(),
  recordingOracle: faker.finance.ethereumAddress(),
  reputationOracle: faker.finance.ethereumAddress(),
  ...overrides,
});

export const createCaptchaJobDto = (overrides = {}): JobCaptchaDto => ({
  chainId: ChainId.POLYGON_AMOY,
  data: {
    provider: getMockedProvider(),
    region: getMockedRegion(),
    bucketName: faker.lorem.word(),
    path: faker.system.filePath(),
  },
  accuracyTarget: faker.number.float({ min: 0.1, max: 1, fractionDigits: 4 }),
  minRequests: faker.number.int({ min: 1, max: 5 }),
  maxRequests: faker.number.int({ min: 6, max: 10 }),
  annotations: {
    typeOfJob: faker.helpers.arrayElement(Object.values(JobCaptchaShapeType)),
    labelingPrompt: faker.lorem.sentence(),
    groundTruths: faker.internet.url(),
    exampleImages: [faker.internet.url(), faker.internet.url()],
    taskBidPrice: faker.number.float({ min: 0.1, max: 10, fractionDigits: 6 }),
    label: faker.lorem.word(),
  },
  completionDate: faker.date.future(),
  paymentCurrency: faker.helpers.arrayElement(Object.values(PaymentCurrency)),
  paymentAmount: faker.number.int({ min: 1, max: 1000 }),
  escrowFundToken: faker.helpers.arrayElement(Object.values(EscrowFundToken)),
  exchangeOracle: faker.finance.ethereumAddress(),
  recordingOracle: faker.finance.ethereumAddress(),
  reputationOracle: faker.finance.ethereumAddress(),
  advanced: {},
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
  entity.token = faker.helpers.arrayElement(
    Object.values(EscrowFundToken),
  ) as EscrowFundToken;
  entity.manifestUrl = faker.internet.url();
  entity.manifestHash = faker.string.uuid();
  entity.failedReason = null;
  entity.requestType = FortuneJobType.FORTUNE;
  entity.status = faker.helpers.arrayElement(Object.values(JobStatus));
  entity.userId = faker.number.int();
  entity.payments = [];
  entity.contentModerationRequests = [];
  entity.retriesCount = faker.number.int({ min: 0, max: 4 });
  entity.waitUntil = faker.date.future();
  Object.assign(entity, overrides);
  return entity;
};
