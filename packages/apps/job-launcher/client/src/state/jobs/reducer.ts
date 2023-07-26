import { createReducer } from '@reduxjs/toolkit';
import { JobsState } from './types';

const initialState: JobsState = {
  data: [],
};

export default createReducer(initialState, (builder) => {});
