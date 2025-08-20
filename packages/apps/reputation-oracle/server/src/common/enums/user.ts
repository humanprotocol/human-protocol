export enum KycStatus {
  NONE = 'none',
  APPROVED = 'approved',
  RESUBMISSION_REQUESTED = 'resubmission_requested',
  DECLINED = 'declined',
  REVIEW = 'review',
  EXPIRED = 'expired',
  ABANDONED = 'abandoned',
}

export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  INACTIVE = 'inactive',
}

export enum UserRole {
  OPERATOR = 'operator',
  WORKER = 'worker',
  ADMIN = 'admin',
}
