export enum ContentModerationRequestStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  POSSIBLE_ABUSE = 'possible_abuse',
  POSITIVE_ABUSE = 'positive_abuse',
  PASSED = 'passed',
  FAILED = 'failed',
}

export enum ContentModerationLevel {
  VERY_LIKELY = 'VERY_LIKELY',
  LIKELY = 'LIKELY',
  POSSIBLE = 'POSSIBLE',
}

export enum ContentModerationFeature {
  SAFE_SEARCH_DETECTION = 'SAFE_SEARCH_DETECTION',
}
