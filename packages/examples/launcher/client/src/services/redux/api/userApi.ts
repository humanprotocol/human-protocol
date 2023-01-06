import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from 'config';
import { setUser } from '../slices/userSlice';
import { IUser } from './types';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${config.apiUrl}/`,
  }),
  endpoints: (builder) => ({
    setUser: builder.mutation<IUser, any>({
      query(data) {
        return {
          url: 'user',
          method: 'POST',
          body: data,
        };
      },
      transformResponse: (result: { data: { user: IUser } }) =>
        result.data.user,
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data));
        } catch (error) {
          console.log(error);
        }
      },
    }),
  }),
});
