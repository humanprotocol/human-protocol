import { useNavigate } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { browserAuthProvider } from '../contexts/browser-auth-provider';
import { useIsUserVerified } from './use-is-user-verified';

export const useHandleMainNavIconClick = () => {
  const navigate = useNavigate();
  const isUserVerified = useIsUserVerified();

  const handleIconClick = () => {
    const type = browserAuthProvider.getAuthType();
    const isAuthenticated =
      browserAuthProvider.isAuthenticated && isUserVerified;

    if (type === 'web3' && isAuthenticated) {
      navigate(routerPaths.operator.profile);
      return;
    }

    if (type === 'web2' && isAuthenticated) {
      navigate(routerPaths.worker.profile);
      return;
    }

    navigate(routerPaths.homePage);
  };

  return handleIconClick;
};
