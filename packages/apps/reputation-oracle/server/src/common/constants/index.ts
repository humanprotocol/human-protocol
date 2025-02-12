import { JobRequestType } from '../enums';

export enum Environment {
  DEVELOPMENT = 'development',
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production',
}
export const NS = 'hmt';
export const RETRIES_COUNT_THRESHOLD = 3;
export const INITIAL_REPUTATION = 0;
export const JWT_PREFIX = 'bearer ';
export const JWT_STRATEGY_NAME = 'jwt-http';

export const CVAT_RESULTS_ANNOTATIONS_FILENAME = 'resulting_annotations.zip';
export const CVAT_VALIDATION_META_FILENAME = 'validation_meta.json';
export const DEFAULT_BULK_PAYOUT_TX_ID = 1;

export const CVAT_JOB_TYPES = [
  JobRequestType.IMAGE_BOXES,
  JobRequestType.IMAGE_POINTS,
  JobRequestType.IMAGE_BOXES_FROM_POINTS,
  JobRequestType.IMAGE_SKELETONS_FROM_BOXES,
  JobRequestType.IMAGE_POLYGONS,
];

export const HEADER_SIGNATURE_KEY = 'human-signature';

export const RESEND_EMAIL_VERIFICATION_PATH =
  '/auth/web2/resend-verification-email';
export const LOGOUT_PATH = '/auth/logout';

export const BACKOFF_INTERVAL_SECONDS = 120;
