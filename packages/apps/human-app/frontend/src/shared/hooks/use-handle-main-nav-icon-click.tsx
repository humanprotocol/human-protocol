import { useNavigate } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { browserAuthProvider } from '../contexts/browser-auth-provider';
import { useIsUserVerified } from './use-is-user-verified';

export const useHandleMainNavIconClick = () => {
  const navigate = useNavigate();
  const isUserVerified = useIsUserVerified();

  const handleIconClick = () => {
    const isAuthenticated =
      browserAuthProvider.isAuthenticated && isUserVerified;

    if (isAuthenticated) {
      navigate(routerPaths.profile);
      return;
    }

    navigate(routerPaths.homePage);
  };

  return handleIconClick;
};
