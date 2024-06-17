import { useLocation } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';

export function useIsHCaptchaLabelingPage() {
  const location = useLocation();
  if (location.pathname === routerPaths.worker.HcaptchaLabeling) {
    return true;
  }
  return false;
}
