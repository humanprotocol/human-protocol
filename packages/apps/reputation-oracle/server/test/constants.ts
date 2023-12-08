import { JobRequestType } from '../src/common/enums';
import { IFortuneManifest } from '../src/common/interfaces/manifest';
import { ImageLabelBinaryJobResults } from '../src/modules/webhook/webhook.dto';

export const MOCK_REQUESTER_TITLE = 'Mock job title';
export const MOCK_REQUESTER_DESCRIPTION = 'Mock job description';
export const MOCK_ADDRESS = '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e';
export const MOCK_FILE_URL = 'mockedFileUrl';
export const MOCK_FILE_HASH = 'mockedFileHash';
export const MOCK_FILE_KEY = 'manifest.json';
export const MOCK_LABEL = 'contains burnt area';
export const MOCK_LABEL_NEGATIVE = '';
export const MOCK_JOB_LAUNCHER_FEE = 5;
export const MOCK_RECORDING_ORACLE_FEE = 5;
export const MOCK_REPUTATION_ORACLE_FEE = 5;
export const MOCK_JOB_LAUNCHER_ADDRESS =
  '0xCf88b3f1992458C2f5a229573c768D0E9F70C441';
export const MOCK_EXCHANGE_ORACLE_ADDRESS =
  '0xCf88b3f1992458C2f5a229573c768D0E9F70C441';
export const MOCK_RECORDING_ORACLE_ADDRESS =
  '0xCf88b3f1992458C2f5a229573c768D0E9F70C442';
export const MOCK_MANIFEST: IFortuneManifest = {
  submissionsRequired: 2,
  requesterTitle: 'Fortune',
  requesterDescription: 'Some desc',
  fee: '20',
  fundAmount: '8',
  requestType: JobRequestType.FORTUNE,
};
export const MOCK_IMAGE_BINARY_LABEL_JOB_RESULTS: ImageLabelBinaryJobResults = {
  dataset: {
    dataset_scores: {
      fleiss_kappa: {
        score: 0.6375655872223378,
        interval: [0.2390581389740375, 0.8568940200253629],
        alpha: 0.05,
      },
      avg_percent_agreement_across_labels: {
        score: 0.8245614035087719,
      },
    },
    data_points: [
      {
        url: 'https://test.storage.googleapis.com/1.png',
        label: MOCK_LABEL_NEGATIVE,
        label_counts: { MOCK_LABEL_NEGATIVE: 3, MOCK_LABEL: 0 },
        score: 1.0,
      },
      {
        url: 'https://test.storage.googleapis.com/10.png',
        label: MOCK_LABEL_NEGATIVE,
        label_counts: { MOCK_LABEL_NEGATIVE: 3, MOCK_LABEL: 0 },
        score: 1.0,
      },
      {
        url: 'https://test.storage.googleapis.com/11.png',
        label: MOCK_LABEL_NEGATIVE,
        label_counts: { MOCK_LABEL_NEGATIVE: 2, MOCK_LABEL: 1 },
        score: 0.6666666666666666,
      },
      {
        url: 'https://test.storage.googleapis.com/12.png',
        label: MOCK_LABEL,
        label_counts: { MOCK_LABEL_NEGATIVE: 0, MOCK_LABEL: 2 },
        score: 1.0,
      },
      {
        url: 'https://test.storage.googleapis.com/13.png',
        label: MOCK_LABEL,
        label_counts: { MOCK_LABEL_NEGATIVE: 0, MOCK_LABEL: 3 },
        score: 1.0,
      },
      {
        url: 'https://test.storage.googleapis.com/14.png',
        label: MOCK_LABEL,
        label_counts: { MOCK_LABEL_NEGATIVE: 0, MOCK_LABEL: 3 },
        score: 1.0,
      },
      {
        url: 'https://test.storage.googleapis.com/15.png',
        label: MOCK_LABEL_NEGATIVE,
        label_counts: { MOCK_LABEL_NEGATIVE: 3, MOCK_LABEL: 0 },
        score: 1.0,
      },
      {
        url: 'https://test.storage.googleapis.com/16.png',
        label: MOCK_LABEL_NEGATIVE,
        label_counts: { MOCK_LABEL_NEGATIVE: 3, MOCK_LABEL: 0 },
        score: 1.0,
      },
      {
        url: 'https://test.storage.googleapis.com/17.png',
        label: MOCK_LABEL_NEGATIVE,
        label_counts: { MOCK_LABEL_NEGATIVE: 3, MOCK_LABEL: 0 },
        score: 1.0,
      },
      {
        url: 'https://test.storage.googleapis.com/18.png',
        label: MOCK_LABEL_NEGATIVE,
        label_counts: { MOCK_LABEL_NEGATIVE: 2, MOCK_LABEL: 1 },
        score: 0.6666666666666666,
      },
      {
        url: 'https://test.storage.googleapis.com/19.png',
        label: MOCK_LABEL_NEGATIVE,
        label_counts: { MOCK_LABEL_NEGATIVE: 2, MOCK_LABEL: 1 },
        score: 0.6666666666666666,
      },
      {
        url: 'https://test.storage.googleapis.com/2.png',
        label: MOCK_LABEL_NEGATIVE,
        label_counts: { MOCK_LABEL_NEGATIVE: 2, MOCK_LABEL: 1 },
        score: 0.6666666666666666,
      },
      {
        url: 'https://test.storage.googleapis.com/3.png',
        label: MOCK_LABEL,
        label_counts: { MOCK_LABEL_NEGATIVE: 1, MOCK_LABEL: 2 },
        score: 0.6666666666666666,
      },
      {
        url: 'https://test.storage.googleapis.com/4.png',
        label: MOCK_LABEL_NEGATIVE,
        label_counts: { MOCK_LABEL_NEGATIVE: 3, MOCK_LABEL: 0 },
        score: 1.0,
      },
      {
        url: 'https://test.storage.googleapis.com/5.png',
        label: MOCK_LABEL,
        label_counts: { MOCK_LABEL_NEGATIVE: 0, MOCK_LABEL: 3 },
        score: 1.0,
      },
      {
        url: 'https://test.storage.googleapis.com/6.png',
        label: MOCK_LABEL,
        label_counts: { MOCK_LABEL_NEGATIVE: 0, MOCK_LABEL: 3 },
        score: 1.0,
      },
      {
        url: 'https://test.storage.googleapis.com/7.png',
        label: MOCK_LABEL,
        label_counts: { MOCK_LABEL_NEGATIVE: 0, MOCK_LABEL: 3 },
        score: 1.0,
      },
      {
        url: 'https://test.storage.googleapis.com/8.png',
        label: MOCK_LABEL_NEGATIVE,
        label_counts: { MOCK_LABEL_NEGATIVE: 3, MOCK_LABEL: 0 },
        score: 1.0,
      },
      {
        url: 'https://test.storage.googleapis.com/9.png',
        label: MOCK_LABEL_NEGATIVE,
        label_counts: { MOCK_LABEL_NEGATIVE: 3, MOCK_LABEL: 0 },
        score: 1.0,
      },
    ],
  },
  worker_performance: [
    {
      worker_id: '0x0755D4d722a4a201c1C5A4B5E614D913e7747b36',
      consensus_annotations: 18,
      total_annotations: 19,
      score: 0.8901734104046242,
    },
    {
      worker_id: '0x0755D4d722a4a201c1C5A4B5E614D913e7747b37',
      consensus_annotations: 16,
      total_annotations: 19,
      score: 0.6705202312138727,
    },
    {
      worker_id: '0x0755D4d722a4a201c1C5A4B5E614D913e7747b38',
      consensus_annotations: 17,
      total_annotations: 18,
      score: 0.8799999999999999,
    },
  ],
};
export const MOCK_PRIVATE_KEY =
  'd334daf65a631f40549cc7de126d5a0016f32a2d00c49f94563f9737f7135e55';
export const MOCK_EMAIL = 'test@example.com';
export const MOCK_PASSWORD = 'password123';
export const MOCK_HASHED_PASSWORD = 'hashedPassword';
export const MOCK_ACCESS_TOKEN = 'access_token';
export const MOCK_REFRESH_TOKEN = 'refresh_token';
export const MOCK_ACCESS_TOKEN_HASHED = 'access_token_hashed';
export const MOCK_REFRESH_TOKEN_HASHED = 'refresh_token_hashed';
export const MOCK_EXPIRES_IN = 1000000000000000;
export const MOCK_SENDGRID_API_KEY =
  'SG.xxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
export const MOCK_SENDGRID_FROM_EMAIL = 'info@hmt.ai';
export const MOCK_SENDGRID_FROM_NAME = 'John Doe';

export const MOCK_S3_ENDPOINT = 'localhost';
export const MOCK_S3_PORT = 9000;
export const MOCK_S3_ACCESS_KEY = 'access_key';
export const MOCK_S3_SECRET_KEY = 'secret_key';
export const MOCK_S3_BUCKET = 'solution';
export const MOCK_S3_USE_SSL = false;

export const MOCK_ENCRYPTION_PRIVATE_KEY = 'private_key';
export const MOCK_ENCRYPTION_PASSPHRASE = 'passphrase';
