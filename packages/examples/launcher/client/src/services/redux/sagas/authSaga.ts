// import { delay, put, call, fork, take } from 'redux-saga/effects';
// import { PayloadAction } from '@reduxjs/toolkit';
// // import { useNavigate } from 'react-router-dom';
// import { ILoginPayload } from '../../api/types';
// import { setAuth } from '../slices/authSlice';

// function* handleLogin(payload: ILoginPayload) {
//   try {
//     yield call(setAuth({ payload }));
//     localStorage.setItem('access_token', 'fake_token');
//     yield put(
//       authActions.loginSuccess({
//         // Dispatch action
//         id: 1,
//         name: 'Zendy',
//       })
//     );

//     // Redirect to Admin page
//     // const navigate = useNavigate();

//     // yield put(navigate('/admin/dashboard'));
//   } catch (error) {
//     yield put(authActions.loginFailed(error.message)); // Dispatch action
//   }
// }

// function* handleLogout() {
//   yield delay(500);
//   localStorage.removeItem('access_token');

//   // Redirect to Login page
//   yield put(push('/login'));
// }

// function* watchLoginFlow() {
//   while (true) {
//     const isLoggedIn = Boolean(localStorage.getItem('access_token'));

//     if (!isLoggedIn) {
//       const action: PayloadAction<LoginPayload> = yield take(
//         authActions.login.type
//       );
//       yield fork(handleLogin, action.payload); // Non-blocking
//     }

//     yield take(authActions.signOut.type);
//     yield call(handleLogout); // Blocking - wait for the signOut function to finish before continuing to watch watchLoginFlow
//   }
// }

// export function* authSaga() {
//   yield fork(watchLoginFlow);
// }

export const fn = () => {};
