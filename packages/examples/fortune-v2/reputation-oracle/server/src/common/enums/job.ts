export enum JobStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  LAUNCHED = "LAUNCHED",
  EXCHANGED = "EXCHANGED",
  RECORDED = "RECORDED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum EscrowStatus {
  LAUNCHED = 0,
  PENDING = 1,
  PAID = 2,
  COMPLETE = 3,
  CANCELLED = 4,
}

export enum JobMode {
  BATCH = "BATCH",
  DESCRIPTIVE = "DESCRIPTIVE",
}

export enum JobRequestType {
  IMAGE_LABEL_BINARY = "IMAGE_LABEL_BINARY",
  FORTUNE = "FORTUNE",
}
