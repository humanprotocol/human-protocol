import { createReducer } from '@reduxjs/toolkit';
import { DashboardState } from './types';

const initialState: DashboardState = {
  dataLoaded: false,
};

export default createReducer(initialState, (builder) => {});
