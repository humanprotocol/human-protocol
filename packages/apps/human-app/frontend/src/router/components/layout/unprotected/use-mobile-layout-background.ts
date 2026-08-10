import { useLocation } from 'react-router-dom';
import signupBackground from '@/assets/background-images/signup-background-mobile.png';
import signinBackground from '@/assets/background-images/signin-background-mobile.png';
import { routerPaths } from '@/router/router-paths';

const signupRoutes = [
  routerPaths.signUp,
  routerPaths.emailVerification,
  routerPaths.verifyEmail,
] as string[];

const signinRoutes = [
  routerPaths.signIn,
  routerPaths.sendResetLink,
  routerPaths.resetPassword,
  routerPaths.sendResetLinkSuccess,
  routerPaths.resetPasswordSuccess,
] as string[];

export function useMobileLayoutBackground() {
  const { pathname } = useLocation();

  if (signupRoutes.includes(pathname)) {
    return signupBackground;
  }

  if (signinRoutes.includes(pathname)) {
    return signinBackground;
  }

  return undefined;
}
