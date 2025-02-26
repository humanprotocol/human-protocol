export enum ContentModerationRequestStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  POSSIBLE_ABUSE = 'possible_abuse',
  POSITIVE_ABUSE = 'positive_abuse',
  PASSED = 'passed',
  FAILED = 'failed',
}

export enum ContentModerationFeature {
  SAFE_SEARCH_DETECTION = 'SAFE_SEARCH_DETECTION',
}
