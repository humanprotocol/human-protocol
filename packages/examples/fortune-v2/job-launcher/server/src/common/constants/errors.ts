/**
 * Represents error messages related to auth.
 */
export enum ErrorAuth {
  Unauthorized = "Unauthorized",
}

/**
 * Represents error messages associated with a job.
 */
export enum ErrorJob {
  NotFound = "Job not found",
  NotCreated = "Job has not been created",
  NotEnoughFunds = "Not enough funds"
}

/**
 * Represents error messages related to escrow.
 */
export enum ErrorEscrow {
  NotFound = "Escrow not found",
  NotCreated = "Escrow has not been created"
}

/**
 * Represents error messages related to user.
 */
export enum ErrorUser {
  NotFound = "User not found",
  DuplicateUsername = "Duplicate username",
  DuplicateEmail = "Duplicate email",
}

/**
 * Represents error messages related to payment.
 */
export enum ErrorPayment {
  NotFound = "Payment not found",
  NotSuccess = "Unseccssful payment",
  CustomerNotFound = "Customer not found",
  IncorrectAmount = "Incorrect amount"
}

/**
 * Represents error messages related to bucket.
 */
export enum ErrorBucket {
  NotPublic = "Bucket is not public",
  UnableSaveFile = "Unable to save file.",
}
