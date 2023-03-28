export enum Auth {
  Unauthorized = "Unauthorized",
}

export enum Job {
  NotFound = "Job not found",
  NotCreated = "Job has not been created",
  NotEnoughFunds = "Not enough funds"
}

export enum Escrow {
  NotFound = "Escrow not found",
  NotCreated = "Escrow has not been created"
}

export enum User {
  NotFound = "User not found",
  DuplicateUsername = "Duplicate username",
  DuplicateEmail = "Duplicate email",
}

export enum Payment {
  NotFound = "Payment not found",
  NotSuccess = "Payment not success",
  CustomerNotFound = "Customer not found",
  IncorrectAmount = "Incorrect amount"
}

export enum Bucket {
  NotPublic = "Bucket is not public",
  UnableSaveFile = "Unable to save file.",
}
