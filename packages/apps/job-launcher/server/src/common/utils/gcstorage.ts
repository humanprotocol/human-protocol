import { GS_PROTOCOL } from '../constants';
import { ErrorBucket } from '../constants/errors';

// Step 1: Define your regular expressions, bucket validation, and URL validation helpers

/**
 * Regex for GCS URL in subdomain format: https://<bucket>.storage.googleapis.com/<object_path>
 */
export const GCS_HTTP_REGEX_SUBDOMAIN =
  /^https:\/\/([a-zA-Z0-9\-.]+)\.storage\.googleapis\.com\/?(.*)$/;

/**
 * Regex for GCS URL in path-based format: https://storage.googleapis.com/<bucket>/<object_path>
 */
export const GCS_HTTP_REGEX_PATH_BASED =
  /^https:\/\/storage\.googleapis\.com\/([^/]+)\/?(.*)$/;

/**
 * Regex for GCS URI format: gs://<bucket>/<object_path>
 */
export const GCS_GS_REGEX = /^gs:\/\/([a-zA-Z0-9\-.]+)\/?(.*)$/;

/**
 * Regex that ensures the bucket name follows Google Cloud Storage (GCS) naming rules:
 * - Must be between 3 and 63 characters long.
 * - Can contain lowercase letters, numbers, dashes (`-`), and dots (`.`).
 * - Cannot begin or end with a dash (`-`).
 * - Cannot have consecutive periods (`..`).
 * - Cannot resemble an IP address (e.g., "192.168.1.1").
 */
const BUCKET_NAME_REGEX = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

// Step 2: Implement the main validation function

/**
 * Validates if a given URL is a valid Google Cloud Storage URL.
 *
 * Supports:
 * - Subdomain format: https://<bucket>.storage.googleapis.com[/<object_path>]
 * - Path-based format: https://storage.googleapis.com/<bucket>[/<object_path>]
 * - GCS URI format: gs://<bucket>[/<object_path>]
 *
 * @param url - The URL to validate.
 * @returns {boolean} - Returns true if the URL is valid, otherwise false.
 */
export function isGCSBucketUrl(url: string): boolean {
  // 1) Quickly check if it's a valid URL in general
  if (!isValidUrl(url)) {
    return false;
  }

  // 2) Try subdomain-based regex first
  let httpMatch = url.match(GCS_HTTP_REGEX_SUBDOMAIN);

  // 3) If that fails, try path-based regex
  if (!httpMatch) {
    httpMatch = url.match(GCS_HTTP_REGEX_PATH_BASED);
  }

  // 4) Also check if it matches the gs:// scheme
  const gsMatch = url.match(GCS_GS_REGEX);

  // 5) If any HTTP or GS regex matched
  if (httpMatch || gsMatch) {
    // For HTTP matches, the bucket is captured in group [1].
    // For GS matches, it's also in group [1].
    const bucketName = httpMatch ? httpMatch[1] : gsMatch ? gsMatch[1] : null;

    if (!bucketName || !isValidBucketName(bucketName)) {
      return false;
    }

    return true;
  }

  return false;
}

/**
 * Validates a URL to check if it is a valid Google Cloud Storage URL.
 * This function ensures the URL is well-formed and its protocol is one of:
 * - `http:` (HTTP URL)
 * - `https:` (HTTPS URL)
 * - `gs:` (Google Cloud Storage URI)
 *
 * @param maybeUrl The URL string to be validated.
 * @returns A boolean indicating whether the URL is valid and has an allowed protocol.
 */
export function isValidUrl(maybeUrl: string): boolean {
  try {
    const url = new URL(maybeUrl);
    return ['http:', 'https:', 'gs:'].includes(url.protocol);
  } catch (_error) {
    return false;
  }
}

/**
 * Validates a Google Cloud Storage bucket name.
 * GCS requires bucket names to:
 * - Be 3-63 characters long
 * - Contain only lowercase letters, numbers, dashes
 * - Not start or end with a dash
 */
function isValidBucketName(bucket: string): boolean {
  return BUCKET_NAME_REGEX.test(bucket);
}

/**
 * Converts a valid Google Cloud Storage HTTP URL to a GCS path.
 *
 * @param url - The HTTP URL to convert.
 * @returns {string} - The converted GCS path.
 * @throws Error - If the URL is not a valid GCS URL.
 */
export function convertToGCSPath(url: string): string {
  if (!isGCSBucketUrl(url)) {
    throw new Error(ErrorBucket.InvalidGCSUrl);
  }

  let match = url.match(GCS_HTTP_REGEX_SUBDOMAIN);
  let bucketName: string | null = null;
  let objectPath: string | null = null;

  if (match) {
    bucketName = match[1];
    objectPath = match[2] || '';
  } else {
    match = url.match(GCS_HTTP_REGEX_PATH_BASED);
    if (match) {
      bucketName = match[1];
      objectPath = match[2] || '';
    }
  }

  if (!bucketName) {
    throw new Error(ErrorBucket.InvalidGCSUrl);
  }

  return `gs://${bucketName}/${objectPath}`;
}

/**
 * Converts a GCS path to a valid Google Cloud Storage HTTP URL.
 *
 * @param gcsPath - The GCS path to convert (e.g., "gs://bucket-name/object-path").
 * @returns {string} - The converted HTTP URL.
 * @throws Error - If the GCS path is not valid.
 */
export function convertToHttpUrl(gcsPath: string): string {
  if (!isGCSBucketUrl(gcsPath)) {
    throw new Error(ErrorBucket.InvalidGCSUrl);
  }

  const match = gcsPath.match(GCS_GS_REGEX);

  const bucketName = match![1];
  const objectPath = match![2] || '';

  return `https://${bucketName}.storage.googleapis.com/${objectPath}`;
}

/**
 * Constructs a GCS path with a variable number of segments.
 *
 * @param bucket - The GCS bucket name (without `gs://`).
 * @param paths - Additional path segments to append.
 * @returns {string} - The constructed GCS path.
 */
export function constructGcsPath(bucket: string, ...paths: string[]): string {
  const cleanBucket = bucket.replace(/^gs:\/\//, '').replace(/\/+$/, '');

  const fullPath = paths
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''))
    .filter((segment) => segment)
    .join('/');

  return fullPath
    ? `${GS_PROTOCOL}${cleanBucket}/${fullPath}`
    : `${GS_PROTOCOL}${cleanBucket}`;
}
