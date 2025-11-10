export enum KycStatus {
  NONE = 'none',
  APPROVED = 'approved',
  RESUBMISSION_REQUESTED = 'resubmission_requested',
  DECLINED = 'declined',
  REVIEW = 'review',
  EXPIRED = 'expired',
  ABANDONED = 'abandoned',
}

export interface WorkerItentityVerificationStatus {
  isVerificationCompleted: boolean;
  status: (typeof KycStatus)[keyof typeof KycStatus];
}
