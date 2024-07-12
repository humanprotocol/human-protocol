export default function setupE2eEnvironment() {
  process.env.NODE_ENV = 'test-e2e';
  process.env.S3_ACCESS_KEY = 'value';

  process.env.POSTGRES_DATABASE = 'job-launcher';
  process.env.POSTGRES_PASSWORD = 'qwerty';
  process.env.POSTGRES_USER = 'default';
  process.env.POSTGRES_HOST = '0.0.0.0';

  process.env.SESSION_SECRET = 'test';
  process.env.POSTGRES_HOST = '0.0.0.0';
  process.env.POSTGRES_USER = 'default';
  process.env.POSTGRES_PASSWORD = 'qwerty';
  process.env.POSTGRES_DATABASE = 'job-launcher';
  process.env.POSTGRES_PORT = '5432';
  process.env.POSTGRES_SSL = 'false';

  process.env.WEB3_ENV = 'localhost';
  process.env.WEB3_PRIVATE_KEY =
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
  process.env.GAS_PRICE_MULTIPLIER = '1';
  process.env.PGP_ENCRYPT = 'false';
  process.env.FORTUNE_EXCHANGE_ORACLE_ADDRESS =
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
  process.env.FORTUNE_RECORDING_ORACLE_ADDRESS =
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
  process.env.CVAT_EXCHANGE_ORACLE_ADDRESS =
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
  process.env.CVAT_RECORDING_ORACLE_ADDRESS =
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
  process.env.REPUTATION_ORACLE_ADDRESS =
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
  process.env.HCAPTCHA_RECORDING_ORACLE_URI = 'a';
  process.env.HCAPTCHA_REPUTATION_ORACLE_URI = 'a';
  process.env.HCAPTCHA_ORACLE_ADDRESS = 'a';
  process.env.HCAPTCHA_SITE_KEY = 'a';

  process.env.HASH_SECRET = 'a328af3fc1dad15342cc3d68936008fa';
  process.env.JWT_PRIVATE_KEY = `-----BEGIN EC PARAMETERS-----
BggqhkjOPQMBBw==
-----END EC PARAMETERS-----
-----BEGIN EC PRIVATE KEY-----
MHcCAQEEID2jVcOtjupW4yqNTz70nvmt1GSvqET5G7lpC0Gp31LFoAoGCCqGSM49
AwEHoUQDQgAEUznVCoagfRCuMA3TfG51xWShNrMJt86lkzfAep9bfBxbaCBbUhJ1
s9+9eeLMG/nUMAaGxWeOwJ92L/KvzN6RFw==
-----END EC PRIVATE KEY-----`;

  process.env.JWT_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEUznVCoagfRCuMA3TfG51xWShNrMJ
t86lkzfAep9bfBxbaCBbUhJ1s9+9eeLMG/nUMAaGxWeOwJ92L/KvzN6RFw==
-----END PUBLIC KEY-----`;
  process.env.JWT_ACCESS_TOKEN_EXPIRES_IN = '600';
  process.env.JWT_REFRESH_TOKEN_EXPIRES_IN = '1d';

  process.env.S3_ENDPOINT = 'localhost';
  process.env.S3_PORT = '9000';
  process.env.S3_ACCESS_KEY = 'access-key';
  process.env.S3_SECRET_KEY = 'secret-key';
  process.env.S3_BUCKET = 'bucket';
  process.env.S3_USE_SSL = 'false';

  process.env.MINIO_ROOT_USER = 'access-key';
  process.env.MINIO_ROOT_PASSWORD = 'secrets-key';

  process.env.STRIPE_API_VERSION = '2022-11-15';
  process.env.STRIPE_APP_NAME = 'Staging Launcher Server';
  process.env.STRIPE_APP_VERSION = '1.0.0';
  process.env.STRIPE_APP_INFO_URL =
    'https://github.com/humanprotocol/human-protocol/tree/main/packages/apps/job-launcher/server';

  process.env.SENDGRID_API_KEY = 'sendgrid-disabled';

  process.env.CRON_SECRET = 'test';
}
