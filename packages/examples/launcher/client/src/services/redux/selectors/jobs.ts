import { createDraftSafeSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { selectSelf } from './auth';

export const makeJobsSelector = createDraftSafeSelector(
  selectSelf,
  (state: RootState) => state.job
);

export const makeJobDetailsSelector = createDraftSafeSelector(
  makeJobsSelector,
  (job) => job.details
);

export const makeTxSelector = createDraftSafeSelector(
  makeJobsSelector,
  (job) => job.tx
);

export const makeTxHashSelector = createDraftSafeSelector(
  makeJobsSelector,
  (job) => job.tx.hash
);
