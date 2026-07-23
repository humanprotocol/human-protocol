import { useLocation } from 'react-router-dom';
import { routerPaths } from '../router-paths';

export function useIsMainPage() {
  const location = useLocation();

  return location.pathname === routerPaths.homePage;
}
