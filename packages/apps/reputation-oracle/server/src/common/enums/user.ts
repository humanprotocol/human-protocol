export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

export enum Role {
  OPERATOR = 'OPERATOR',
  WORKER = 'WORKER',
  HUMAN_APP = 'HUMAN_APP',
  ADMIN = 'ADMIN',
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
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
