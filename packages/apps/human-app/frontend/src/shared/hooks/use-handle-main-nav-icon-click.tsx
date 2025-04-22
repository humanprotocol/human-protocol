import { useNavigate } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { useHomePageState } from '../contexts/homepage-state/use-homepage-state';
import { browserAuthProvider } from '../contexts/browser-auth-provider';

export const useHandleMainNavIconClick = () => {
  const navigate = useNavigate();
  const { setPageView } = useHomePageState();

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

    setPageView('welcome');
    navigate(routerPaths.homePage);
  };

  return handleIconClick;
};
