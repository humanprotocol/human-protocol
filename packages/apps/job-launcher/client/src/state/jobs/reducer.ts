import { createAsyncThunk, createReducer } from '@reduxjs/toolkit';
import { AppState } from '..';
import * as jobService from '../../services/job';
import { JobsState, UserJob } from './types';

const initialState: JobsState = {
  jobs: [],
  dataLoaded: false,
  loadingFailed: false,
};

export const fetchUserJobsAsync = createAsyncThunk<
  UserJob[],
  void,
  { state: AppState }
>('auth/fetchUserJobsAsync', async () => {
  const jobs = await jobService.getJobList();
  return jobs;
});

export default createReducer(initialState, (builder) => {
  builder.addCase(fetchUserJobsAsync.fulfilled, (state, action) => {
    state.jobs = action.payload;
    state.dataLoaded = true;
  });
  builder.addCase(fetchUserJobsAsync.rejected, (state, action) => {
    state.loadingFailed = true;
    state.dataLoaded = false;
  });
});
