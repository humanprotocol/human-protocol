import type { RouteProps } from 'react-router-dom';
import { t } from 'i18next';
import { HomePage } from '@/pages/homepage/home.page';
import { Playground } from '@/pages/playground/playground.page';
import { ProtectedPage } from '@/pages/protected.page';
import { SignInWorkerPage } from '@/pages/worker/sign-in.page';
import { SignUpWorkerPage } from '@/pages/worker/sign-up.page';
import { OperatorProfilePage } from '@/pages/operator/profile/profile.page';
import { WorkerProfilePage } from '@/pages/worker/profile/profile.page';
import { SignInOperatorPage } from '@/pages/operator/sign-in.page';
import { ConnectWalletOperatorPage } from '@/pages/operator/sign-up/connect-wallet.page';
import { routerPaths } from '@/router/router-paths';
import { AddStakeOperatorPage } from '@/pages/operator/sign-up/add-stake/add-stake.page';
import { SendResetLinkWorkerSuccessPage } from '@/pages/worker/send-reset-link/send-reset-link-success.page';
import { ResetPasswordWorkerPage } from '@/pages/worker/reset-password/reset-password.page';
import { SendResetLinkWorkerPage } from '@/pages/worker/send-reset-link/send-reset-link.page';
import { ResetPasswordWorkerSuccessPage } from '@/pages/worker/reset-password/reset-password-success.page';
import { EmailVerificationWorkerPage } from '@/pages/worker/email-verification/email-verification.page';
import { SendEmailVerificationWorkerPage } from '@/pages/worker/email-verification/send-email-verification.page';
import { AddKeysOperatorPage } from '@/pages/operator/sign-up/add-keys/add-keys.page';
import { EditExistingKeysSuccessPage } from '@/pages/operator/sign-up/add-keys/edit-existing-keys-success.page';
import type { PageHeaderProps } from '@/components/layout/protected/page-header';
import { HomepageWorkIcon, ProfileIcon } from '@/components/ui/icons';
import { JobsDiscoveryPage } from '@/pages/worker/jobs-discovery/jobs-discovery.page';
import { JobsPage } from '@/pages/worker/jobs/jobs.page';

export const unprotectedRoutes: RouteProps[] = [
  {
    path: routerPaths.homePage,
    element: <HomePage />,
  },
  {
    path: routerPaths.playground,
    element: <Playground />,
  },
  {
    path: routerPaths.worker.signIn,
    element: <SignInWorkerPage />,
  },
  {
    path: routerPaths.worker.signUp,
    element: <SignUpWorkerPage />,
  },
  {
    path: routerPaths.operator.signIn,
    element: <SignInOperatorPage />,
  },
  {
    path: routerPaths.operator.connectWallet,
    element: <ConnectWalletOperatorPage />,
  },
  {
    path: routerPaths.worker.emailVerification,
    element: <EmailVerificationWorkerPage />,
  },
  {
    path: routerPaths.worker.sendEmailVerification,
    element: <SendEmailVerificationWorkerPage />,
  },
  {
    path: routerPaths.worker.sendResetLink,
    element: <SendResetLinkWorkerPage />,
  },
  {
    path: routerPaths.worker.resetPassword,
    element: <ResetPasswordWorkerPage />,
  },
  {
    path: routerPaths.worker.sendResetLinkSuccess,
    element: <SendResetLinkWorkerSuccessPage />,
  },
  {
    path: routerPaths.worker.resetPasswordSuccess,
    element: <ResetPasswordWorkerSuccessPage />,
  },
];

export const protectedRoutes: {
  routerProps: RouteProps;
  pageHeaderProps: PageHeaderProps;
}[] = [
  {
    routerProps: {
      path: '/protected',
      element: <ProtectedPage />,
    },
    pageHeaderProps: {
      headerIcon: <ProfileIcon />,
      headerText: t('protectedPagesHeaders.profile'),
    },
  },
  {
    routerProps: {
      path: routerPaths.worker.jobsDiscovery,
      element: <JobsDiscoveryPage />,
    },
    pageHeaderProps: {
      headerIcon: <HomepageWorkIcon />,
      headerText: t('protectedPagesHeaders.jobsDiscovery'),
    },
  },
  {
    routerProps: {
      path: routerPaths.worker.jobs,
      element: <JobsPage />,
    },
    pageHeaderProps: {
      headerIcon: <HomepageWorkIcon />,
      headerText: t('protectedPagesHeaders.jobs'),
    },
  },
  {
    routerProps: {
      path: routerPaths.worker.profile,
      element: <WorkerProfilePage />,
    },
    pageHeaderProps: {
      headerIcon: <ProfileIcon />,
      headerText: t('protectedPagesHeaders.profile'),
    },
  },
];

export const web3ProtectedRoutes: {
  routerProps: RouteProps;
  pageHeaderProps: PageHeaderProps;
}[] = [
  {
    routerProps: {
      path: routerPaths.operator.profile,
      element: <OperatorProfilePage />,
    },
    pageHeaderProps: {
      headerIcon: <ProfileIcon />,
      headerText: t('web3ProtectedPagesHeaders.profile'),
    },
  },
];

export const walletConnectRoutes: RouteProps[] = [
  {
    path: routerPaths.operator.addStake,
    element: <AddStakeOperatorPage />,
  },
  {
    path: routerPaths.operator.addKeys,
    element: <AddKeysOperatorPage />,
  },
  {
    path: routerPaths.operator.editExistingKeysSuccess,
    element: <EditExistingKeysSuccessPage />,
  },
];
