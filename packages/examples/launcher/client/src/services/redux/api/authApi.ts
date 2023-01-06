import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { toast } from 'react-toastify';
import { config } from 'config';
import { ILoginSchema } from '../../../pages/Login/LoginPageView';
import { IRestoreSchema } from '../../../pages/RestorePassword/RestorePasswordView';
import { ISignUpSchema } from '../../../pages/SignUp/SignUpView';
import { IToken, IGenericResponse, IRefresh } from './types';
import { authSlice } from '../slices/authSlice';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${config.apiUrl}/auth/`,
    prepareHeaders: (headers) => {
      headers.set('Access-Control-Allow-Origin', 'no-cors');
      return headers;
    },
    credentials: 'include',
  }),
  endpoints: (builder) => ({
    signUpUser: builder.mutation<IToken, ISignUpSchema>({
      query(data) {
        return {
          url: 'signup',
          method: 'POST',
          body: data,
          credentials: 'include',
        };
      },
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const {
            data: { accessToken, refreshToken },
          } = await queryFulfilled;

          if (accessToken && refreshToken) {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            dispatch(authSlice.actions.setAuth({ isAuth: true }));
          }
        } catch (error) {
          console.log(error);
          toast.error('Please try again', {
            position: 'top-right',
          });
        }
      },
    }),
    refreshToken: builder.mutation<IToken, IRefresh>({
      query(data) {
        return {
          url: 'refresh',
          method: 'POST',
          body: data,
        };
      },
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const {
            data: { accessToken, refreshToken },
          } = await queryFulfilled;

          if (accessToken && refreshToken) {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            dispatch(authSlice.actions.setAuth({ isAuth: true }));
          }
        } catch (error) {
          console.log(error);
          toast.error('Please try again', {
            position: 'top-right',
          });
        }
      },
    }),
    loginUser: builder.mutation<IToken, ILoginSchema>({
      query(data) {
        return {
          url: 'signin',
          method: 'POST',
          body: data,
          credentials: 'include',
        };
      },
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const {
            data: { accessToken, refreshToken },
          } = await queryFulfilled;

          if (accessToken && refreshToken) {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            dispatch(authSlice.actions.setAuth({ isAuth: true }));
          }
        } catch (error) {
          console.log(error);
          toast.error('Please try again', {
            position: 'top-right',
          });
        }
      },
    }),
    logoutUser: builder.mutation<void, void>({
      query() {
        localStorage.clear();
        return {
          url: 'signOut',
          credentials: 'include',
        };
      },
    }),
    forgotPassword: builder.mutation<IGenericResponse, IRestoreSchema>({
      query(data) {
        return {
          url: 'forgot-password',
          method: 'POST',
          body: data,
        };
      },
    }),
    restorePassword: builder.mutation<IGenericResponse, IRestoreSchema>({
      query(data) {
        return {
          url: 'forgot-password',
          method: 'POST',
          body: data,
        };
      },
    }),
    verifyEmail: builder.mutation<IGenericResponse, any>({
      query(data) {
        return {
          url: 'email-verification',
          method: 'POST',
          body: data,
        };
      },
    }),
    resendEmailVerification: builder.mutation<IGenericResponse, any>({
      query(data) {
        return {
          url: 'resend-email-verification',
          method: 'POST',
          body: data,
        };
      },
    }),
  }),
});

export const {
  useSignUpUserMutation,
  useRefreshTokenMutation,
  useLoginUserMutation,
  useLogoutUserMutation,
  useForgotPasswordMutation,
  useRestorePasswordMutation,
  useVerifyEmailMutation,
  useResendEmailVerificationMutation,
} = authApi;
