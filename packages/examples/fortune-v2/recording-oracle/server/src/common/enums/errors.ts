export enum Auth {
  Unauthorized = "Unauthorized",
}

export enum Job {
  NotFound = "Job not found",
  NotCreated = "Job has not been created"
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
  CustomerNotFound = "Customer not found"
}

export enum Bucket {
  NotPublic = "Bucket is not public",
  UnableSaveFile = "Unable to save file.",
}

export enum Webhook {
  NotFound = "Webhook not found",
  NotCreated = "Webhook has not been created",
  BadParams = "Bad params"
}