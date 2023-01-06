import * as React from 'react';

const LazyHome = React.lazy(() =>
  import('../../pages/Home').then(({ default: Home }) => ({
    default: Home,
  }))
);

const LazyJobCreatorForm = React.lazy(() =>
  import('../../pages/JobCreatorForm').then(({ default: JobCreatorForm }) => ({
    default: JobCreatorForm,
  }))
);

const LazyLogin = React.lazy(() =>
  import('../../pages/Login').then(({ default: Login }) => ({
    default: Login,
  }))
);

const LazySignUp = React.lazy(() =>
  import('../../pages/SignUp').then(({ default: SignUp }) => ({
    default: SignUp,
  }))
);

const LazyRestorePassword = React.lazy(() =>
  import('../../pages/RestorePassword').then(
    ({ default: RestorePassword }) => ({
      default: RestorePassword,
    })
  )
);

interface Route {
  key: string;
  title: string;
  path: string;
  private: boolean;
  component: React.FC<{}>;
}

export const routes: Array<Route> = [
  {
    key: 'Home-route',
    title: 'Home',
    path: '/',
    private: false,
    component: LazyHome,
  },
  {
    key: 'Login-route',
    title: 'Login',
    path: '/login',
    private: false,
    component: LazyLogin,
  },
  {
    key: 'SignUp-route',
    title: 'SignUp',
    path: '/signup',
    private: false,
    component: LazySignUp,
  },
  {
    key: 'Restore-password-route',
    title: 'Restore-pass',
    path: '/forgot-password',
    private: false,
    component: LazyRestorePassword,
  },
  {
    key: 'Job-create-route',
    title: 'Job-create',
    path: '/job-create',
    private: false,
    component: LazyJobCreatorForm,
  },
];
