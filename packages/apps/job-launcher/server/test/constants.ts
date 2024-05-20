import { AWSRegions, StorageProviders } from '../src/common/enums/storage';
import { JobRequestType } from '../src/common/enums/job';
import {
  FortuneManifestDto,
  StorageDataDto,
  CvatDataDto,
  Label,
} from '../src/modules/job/job.dto';

export const MOCK_REQUESTER_TITLE = 'Mock job title';
export const MOCK_REQUESTER_DESCRIPTION = 'Mock job description';
export const MOCK_SUBMISSION_REQUIRED = 5;
export const MOCK_CHAIN_ID = 1;
export const MOCK_ADDRESS = '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e';
export const MOCK_FILE_URL = 'http://mockedFileUrl.test/bucket/file.json';
export const MOCK_FILE_HASH = 'mockedFileHash';
export const MOCK_FILE_KEY = 'manifest.json';
export const MOCK_BUCKET_FILES = [
  'file0',
  'file1',
  'file2',
  'file3',
  'file4',
  'file5',
];
export const MOCK_PRIVATE_KEY =
  'd334daf65a631f40549cc7de126d5a0016f32a2d00c49f94563f9737f7135e55';
export const MOCK_WEB3_RPC_URL = 'http://localhost:8545';
export const MOCK_WEB3_NODE_HOST = 'localhost';
export const MOCK_BUCKET_NAME = 'bucket-name';
export const MOCK_EXCHANGE_ORACLE_ADDRESS =
  '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e';
export const MOCK_RECORDING_ORACLE_ADDRESS =
  '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e';
export const MOCK_REPUTATION_ORACLE_ADDRESS =
  '0x2E04d5D6cE3fF2261D0Cb04d41Fb4Cd67362A473';
export const MOCK_EXCHANGE_ORACLE_WEBHOOK_URL = 'http://localhost:3000';
export const MOCK_JOB_LAUNCHER_FEE = 5;
export const MOCK_ORACLE_FEE = 5;
export const MOCK_TRANSACTION_HASH =
  '0xd28e4c40571530afcb25ea1890e77b2d18c35f06049980ca4fb71829f64d89dc';
export const MOCK_SIGNATURE =
  '0x1502ec7e795ed9c96b215e80d46d87e26141bc8d41f69ee1bfbc8d8ed9a700db62136da8ee35eadbfd678817342444dff0239508be51c1fae55d62fcdba2867e1b';
export const MOCK_EMAIL = 'test@example.com';
export const MOCK_PASSWORD = 'password123';
export const MOCK_HASHED_PASSWORD = 'hashedPassword';
export const MOCK_CUSTOMER_ID = 'customer123';
export const MOCK_PAYMENT_ID = 'payment123';
export const MOCK_ACCESS_TOKEN = 'access_token';
export const MOCK_REFRESH_TOKEN = 'refresh_token';
export const MOCK_ACCESS_TOKEN_HASHED = 'access_token_hashed';
export const MOCK_REFRESH_TOKEN_HASHED = 'refresh_token_hashed';
export const MOCK_EXPIRES_IN = 1000000000000000;
export const MOCK_USER_ID = 1;
export const MOCK_JOB_ID = 1;

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
export const MOCK_MANIFEST: FortuneManifestDto = {
  submissionsRequired: 2,
  requesterTitle: 'Fortune',
  requesterDescription: 'Some desc',
  fundAmount: 10,
  requestType: JobRequestType.FORTUNE,
};

export const MOCK_ENCRYPTED_MANIFEST = 'encryptedManifest';
export const MOCK_PGP_PRIVATE_KEY = `-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEZS6w6BYJKwYBBAHaRw8BAQdAXRzFR1ROwdb4Bu7RKYXcBvJsH6JmBxiT
Zwbnk3KUBiUAAP9N8d16MWV/M+yggH6cTODDCNCDV/Ic012RP0fTI4VEjhFF
zRtKb2IgTGF1bmNoZXIgPGFkbWluQGhtdC5haT7CjAQQFgoAPgWCZS6w6AQL
CQcICZBAfiPaLRaJeAMVCAoEFgACAQIZAQKbAwIeARYhBNvDQnyGS7m0aAs+
BUB+I9otFol4AACYcAEA/c1peyz3aWsB9NkvOfy/erdqkNAAHfikCKzGRKtD
sKcA/Rk9IHYRBzrvXyXXpFYkeFR1H6dXTUYzoZy8xoFleSIOx10EZS6w6BIK
KwYBBAGXVQEFAQEHQPOpvDe3nptX0ZqcFsUz/K7HHnSSOIn/aGYfrZfKAwQ1
AwEIBwAA/3fQjUAKIaoDAQTB2Jufw9g1JBybjMXSb3YCWunTB6ZgD5vCeAQY
FggAKgWCZS6w6AmQQH4j2i0WiXgCmwwWIQTbw0J8hku5tGgLPgVAfiPaLRaJ
eAAAYHMBAPI7LdZ8k4lQBvlXjVMV3hlkQGtKp+EXHd3BaT1hpniVAP4wecxi
7jxPB0Thko1w1Ro6ZYsFtlOB52qocYtduLJkCA==
=qV+I
-----END PGP PRIVATE KEY BLOCK-----`;

export const MOCK_PGP_PUBLIC_KEY = `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEZS6w6BYJKwYBBAHaRw8BAQdAXRzFR1ROwdb4Bu7RKYXcBvJsH6JmBxiT
Zwbnk3KUBiXNG0pvYiBMYXVuY2hlciA8YWRtaW5AaG10LmFpPsKMBBAWCgA+
BYJlLrDoBAsJBwgJkEB+I9otFol4AxUICgQWAAIBAhkBApsDAh4BFiEE28NC
fIZLubRoCz4FQH4j2i0WiXgAAJhwAQD9zWl7LPdpawH02S85/L96t2qQ0AAd
+KQIrMZEq0OwpwD9GT0gdhEHOu9fJdekViR4VHUfp1dNRjOhnLzGgWV5Ig7O
OARlLrDoEgorBgEEAZdVAQUBAQdA86m8N7eem1fRmpwWxTP8rscedJI4if9o
Zh+tl8oDBDUDAQgHwngEGBYIACoFgmUusOgJkEB+I9otFol4ApsMFiEE28NC
fIZLubRoCz4FQH4j2i0WiXgAAGBzAQDyOy3WfJOJUAb5V41TFd4ZZEBrSqfh
Fx3dwWk9YaZ4lQD+MHnMYu48TwdE4ZKNcNUaOmWLBbZTgedqqHGLXbiyZAg=
=IMAe
-----END PGP PUBLIC KEY BLOCK-----`;
export const MOCK_HCAPTCHA_ORACLE_ADDRESS =
  '0xa62a1c18571b869e43eeabd217e233e7f0275af3';
export const MOCK_CVAT_JOB_SIZE = '10';
export const MOCK_CVAT_MAX_TIME = '300';
export const MOCK_CVAT_VAL_SIZE = '2';
export const MOCK_CVAT_SKELETONS_JOB_SIZE_MULTIPLIER = '6';
export const MOCK_HCAPTCHA_SITE_KEY = '1234';
export const MOCK_HCAPTCHA_IMAGE_URL =
  'http://mockedFileUrl.test/bucket/img_1.jpg';
export const MOCK_HCAPTCHA_IMAGE_LABEL = 'cat';
export const MOCK_HCAPTCHA_REPO_URI = 'http://recoracle:3000';
export const MOCK_HCAPTCHA_RO_URI = 'http://recoracle:3000';
export const MOCK_MAX_RETRY_COUNT = 5;
export const MOCK_STORAGE_DATA: StorageDataDto = {
  provider: StorageProviders.AWS,
  region: AWSRegions.EU_CENTRAL_1,
  bucketName: 'bucket',
  path: 'folder/test',
};
export const MOCK_CVAT_DATA_DATASET: CvatDataDto = {
  dataset: MOCK_STORAGE_DATA,
};

export const MOCK_CVAT_DATA_POINTS: CvatDataDto = {
  dataset: MOCK_STORAGE_DATA,
  points: MOCK_STORAGE_DATA,
};

export const MOCK_CVAT_DATA_BOXES: CvatDataDto = {
  dataset: MOCK_STORAGE_DATA,
  boxes: MOCK_STORAGE_DATA,
};

export const MOCK_CVAT_LABELS: Label[] = [
  {
    name: 'label1',
  },
  {
    name: 'label2',
  },
];

export const MOCK_CVAT_LABELS_WITH_NODES: Label[] = [
  {
    name: 'label1',
    nodes: ['node 1', 'node 2', 'node 3', 'node 4'],
  },
  {
    name: 'label2',
    nodes: ['node 1', 'node 2', 'node 3', 'node 4'],
  },
];

export const MOCK_BUCKET_FILE =
  'https://bucket.s3.eu-central-1.amazonaws.com/folder/test';

export const MOCK_CVAT_DATA = {
  images: [
    {
      id: 1,
      file_name: '1.jpg',
    },
    {
      id: 2,
      file_name: '2.jpg',
    },
    {
      id: 3,
      file_name: '3.jpg',
    },
    {
      id: 4,
      file_name: '4.jpg',
    },
    {
      id: 5,
      file_name: '5.jpg',
    },
  ],
  annotations: [
    {
      image_id: 1,
    },
    {
      image_id: 2,
    },
    {
      image_id: 3,
    },
    {
      image_id: 4,
    },
    {
      image_id: 5,
    },
  ],
};

export const MOCK_CVAT_GT = {
  images: [
    {
      file_name: '1.jpg',
    },
    {
      file_name: '2.jpg',
    },
    {
      file_name: '3.jpg',
    },
  ],
};
