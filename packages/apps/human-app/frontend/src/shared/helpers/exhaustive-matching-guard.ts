export const exhaustiveMatchingGuard = (_: never): never => {
  throw new Error(`Should not have reached here`);
};
