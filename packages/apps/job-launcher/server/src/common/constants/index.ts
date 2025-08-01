import { ChainId } from '@human-protocol/sdk';
import { CvatJobType, JobStatus } from '../enums/job';

export const SERVICE_NAME = 'Job Launcher';
export const NS = 'hmt';
export const COINGECKO_API_URL =
  'https://api.coingecko.com/api/v3/simple/price';
export const DEFAULT_MAX_RETRY_COUNT = 3;
export const TX_CONFIRMATION_TRESHOLD = 1;

export const JWT_PREFIX = 'bearer ';

export const LOCALHOST_CHAIN_IDS = [ChainId.LOCALHOST];

export const TESTNET_CHAIN_IDS = [
  ChainId.BSC_TESTNET,
  ChainId.POLYGON_AMOY,
  ChainId.SEPOLIA,
  ChainId.AURORA_TESTNET,
];
export const MAINNET_CHAIN_IDS = [ChainId.BSC_MAINNET, ChainId.POLYGON];

export const SENDGRID_API_KEY_REGEX =
  /^SG\.[A-Za-z0-9-_]{22}\.[A-Za-z0-9-_]{43}$/;
export const SENDGRID_API_KEY_DISABLED = 'sendgrid-disabled';

export const HEADER_SIGNATURE_KEY = 'human-signature';

export const CVAT_JOB_TYPES = [
  CvatJobType.IMAGE_POLYGONS,
  CvatJobType.IMAGE_BOXES,
  CvatJobType.IMAGE_POINTS,
  CvatJobType.IMAGE_BOXES_FROM_POINTS,
  CvatJobType.IMAGE_SKELETONS_FROM_BOXES,
];

export const CANCEL_JOB_STATUSES = [
  JobStatus.PAID,
  JobStatus.FAILED,
  JobStatus.LAUNCHED,
  JobStatus.FUNDED,
  JobStatus.CREATED,
  JobStatus.PARTIAL,
];

export const SENDGRID_TEMPLATES = {
  signup: 'd-ca99cc7410aa4e6dab3e6042d5ecb9a3',
  resetPassword: 'd-3ac74546352a4e1abdd1689947632c22',
  passwordChanged: 'd-ca0ac7e6fff845829cd0167af09f25cf',
};

export const HCAPTCHA_MIN_SHAPES_PER_IMAGE = 1;
export const HCAPTCHA_MAX_SHAPES_PER_IMAGE = 1;
export const HCAPTCHA_MINIMUM_SELECTION_AREA_PER_SHAPE = 5;
export const HCAPTCHA_LANDMARK_MIN_POINTS = 1;
export const HCAPTCHA_LANDMARK_MAX_POINTS = 8;
export const HCAPTCHA_BOUNDING_BOX_MIN_POINTS = 4;
export const HCAPTCHA_BOUNDING_BOX_MAX_POINTS = 4;
export const HCAPTCHA_POLYGON_MIN_POINTS = 4;
export const HCAPTCHA_POLYGON_MAX_POINTS = 4;
export const HCAPTCHA_IMMO_MIN_LENGTH = 1;
export const HCAPTCHA_IMMO_MAX_LENGTH = 100;
export const HCAPTCHA_ORACLE_STAKE = 0.05;

export const HCAPTCHA_NOT_PRESENTED_LABEL = 'Not presented';

export const RESEND_EMAIL_VERIFICATION_PATH = '/auth/resend-email-verification';
export const LOGOUT_PATH = '/auth/logout';

export const MUTEX_TIMEOUT = 2000; //ms

export const GS_PROTOCOL = 'gs://';
export const GCV_CONTENT_MODERATION_ASYNC_BATCH_SIZE = 100;
export const GCV_CONTENT_MODERATION_BATCH_SIZE_PER_TASK = 2000;
