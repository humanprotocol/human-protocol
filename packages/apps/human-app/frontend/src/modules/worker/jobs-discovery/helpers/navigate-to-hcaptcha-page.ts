import { type NavigateFunction } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';

interface NavigateToHCaptchaPageProps {
  siteKey: string | null | undefined;
  navigate: NavigateFunction;
}

export const navigateToHCaptchaPage = ({
  siteKey,
  navigate,
}: NavigateToHCaptchaPageProps): void => {
  const route = siteKey
    ? routerPaths.worker.HcaptchaLabeling
    : routerPaths.worker.enableLabeler;

  navigate(route);
};
