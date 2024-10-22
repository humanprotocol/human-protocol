export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

export enum Role {
  OPERATOR = 'operator',
  WORKER = 'worker',
  HUMAN_APP = 'human_app',
  ADMIN = 'admin',
}

export enum KycStatus {
  NONE = 'none',
  APPROVED = 'approved',
  RESUBMISSION_REQUESTED = 'resubmission_requested',
  DECLINED = 'declined',
  REVIEW = 'review',
  EXPIRED = 'expired',
  ABANDONED = 'abandoned',
  ERROR = 'error',
}

export enum OperatorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
