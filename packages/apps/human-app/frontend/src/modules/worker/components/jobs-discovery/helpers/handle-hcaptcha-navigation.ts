import { type NavigateFunction } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';

interface HandleHCaptchaNavigationProps {
  siteKey?: string | null | undefined;
  navigate: NavigateFunction;
}

export const handleHCaptchaNavigation = ({
  siteKey,
  navigate,
}: HandleHCaptchaNavigationProps): void => {
  const route = siteKey
    ? routerPaths.worker.HcaptchaLabeling
    : routerPaths.worker.enableLabeler;

  navigate(route);
};
