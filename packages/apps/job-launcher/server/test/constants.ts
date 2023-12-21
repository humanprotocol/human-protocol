import { AWSRegions, StorageProviders } from '../src/common/enums/storage';
import { JobRequestType } from '../src/common/enums/job';
import { FortuneManifestDto, StorageDataDto } from '../src/modules/job/job.dto';

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

xVgEZTveLhYJKwYBBAHaRw8BAQdAD7pTrDk129glXoPH+rMofQwsQuyuo1j0
Q1fXrBmoPwcAAP4qsdYoTBZ7fXhaP9sjJMhGtYLg2Ux7ODQ5Ix6Ws7/V4A/M
zRZldWdlbmUgPGV1Z2VuZUBobXQuYWk+wowEEBYKAD4FgmU73i4ECwkHCAmQ
+tuf/UifrmMDFQgKBBYAAgECGQECmwMCHgEWIQRihZ0fm6KM8/bPWt7625/9
SJ+uYwAAq/0BAOJ3WYERhsp2xSbS45Gixp9QGsOCC1Ef2TiUlO2R3vDAAP9Q
1snuCth7bM1EdJBsIYJPuGP0CL0Nv4hzZm0KcNxtDsddBGU73i4SCisGAQQB
l1UBBQEBB0B5C9OzSIcuiWkhkzO5xyc5k4pp0JRqGLs81d7OCWUgSQMBCAcA
AP9wcvfUXUNks+0ggHgI7iZTy7q1slQT8YUh+oyxU6UheBGJwngEGBYIACoF
gmU73i4JkPrbn/1In65jApsMFiEEYoWdH5uijPP2z1re+tuf/UifrmMAAMZQ
AQDGveM6dh1co+7vkCsYs4vCoDBRQcSByD6FSbBmq8JJugD7Bpk0bm95Oi9M
UJgXNi74umGlLKtWNrbJIYiY1yHFSA4=
=27X/
-----END PGP PRIVATE KEY BLOCK-----`;
export const MOCK_PGP_PUBLIC_KEY = `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEZTveLhYJKwYBBAHaRw8BAQdAD7pTrDk129glXoPH+rMofQwsQuyuo1j0
Q1fXrBmoPwfNFmV1Z2VuZSA8ZXVnZW5lQGhtdC5haT7CjAQQFgoAPgWCZTve
LgQLCQcICZD625/9SJ+uYwMVCAoEFgACAQIZAQKbAwIeARYhBGKFnR+boozz
9s9a3vrbn/1In65jAACr/QEA4ndZgRGGynbFJtLjkaLGn1Aaw4ILUR/ZOJSU
7ZHe8MAA/1DWye4K2HtszUR0kGwhgk+4Y/QIvQ2/iHNmbQpw3G0OzjgEZTve
LhIKKwYBBAGXVQEFAQEHQHkL07NIhy6JaSGTM7nHJzmTimnQlGoYuzzV3s4J
ZSBJAwEIB8J4BBgWCAAqBYJlO94uCZD625/9SJ+uYwKbDBYhBGKFnR+boozz
9s9a3vrbn/1In65jAADGUAEAxr3jOnYdXKPu75ArGLOLwqAwUUHEgcg+hUmw
ZqvCSboA+waZNG5veTovTFCYFzYu+LphpSyrVja2ySGImNchxUgO
=uLQK
-----END PGP PUBLIC KEY BLOCK-----`;
export const MOCK_HCAPTCHA_PGP_PUBLIC_KEY = `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEZTFB7RYJKwYBBAHaRw8BAQdAEqnF7yvbnHaL5nM7uryCts/FAnBazgBA
ldusotlPEgnNGWFsaWR6bSA8cWFyejg5QGdtYWlsLmNvbT7CjAQQFgoAPgWC
ZTFB7QQLCQcICZCyJEVcrn3KbAMVCAoEFgACAQIZAQKbAwIeARYhBCWadFbn
oT02XD9wsbIkRVyufcpsAAA02AD/bTo/OX+PceOMfWgQlK4KrUTrrEFayWgL
RODAqZIVFXABAK/q1P1t54pSXmZs1p76LR9eLkzWpXzxs1UjYUlJPzEPzjgE
ZTFB7RIKKwYBBAGXVQEFAQEHQB8t/IZJLOiA0erKV7qyXWpvdiUegoDpdeDU
68nBw1tiAwEIB8J4BBgWCAAqBYJlMUHtCZCyJEVcrn3KbAKbDBYhBCWadFbn
oT02XD9wsbIkRVyufcpsAADvXAEAu9cf+VXbCe5Kj+7G3gRQnO+smX/gySHj
Cj8wO9Ii68YA/1EpYseshTKcNncCad8Npro313/PpE3SzsCP1b+58mkD
=XWPr
-----END PGP PUBLIC KEY BLOCK-----`;
export const MOCK_HCAPTCHA_ORACLE_ADDRESS =
  '0xa62a1c18571b869e43eeabd217e233e7f0275af3';
export const MOCK_CVAT_JOB_SIZE = '10';
export const MOCK_CVAT_MAX_TIME = '300';
export const MOCK_CVAT_VAL_SIZE = '2';
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
export const MOCK_BUCKET_FILE =
  'https://bucket.s3.eu-central-1.amazonaws.com/folder/test';
