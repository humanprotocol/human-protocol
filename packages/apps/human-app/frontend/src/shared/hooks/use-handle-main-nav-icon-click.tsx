import { useNavigate } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { browserAuthProvider } from '../contexts/browser-auth-provider';

export const useHandleMainNavIconClick = () => {
  const navigate = useNavigate();

  const handleIconClick = () => {
    const type = browserAuthProvider.getAuthType();
    const isAuthenticated = browserAuthProvider.isAuthenticated;

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
