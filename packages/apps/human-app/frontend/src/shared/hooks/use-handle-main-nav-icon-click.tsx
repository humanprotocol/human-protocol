import { useNavigate } from 'react-router-dom';
import { useWeb3Auth } from '@/modules/auth-web3/hooks/use-web3-auth';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { useHomePageState } from '@/shared/contexts/homepage-state';
import { routerPaths } from '@/router/router-paths';

export const useHandleMainNavIconClick = () => {
  const navigate = useNavigate();
  const { user: web3User } = useWeb3Auth();
  const { user: web2Auth } = useAuth();
  const { setPageView } = useHomePageState();

  const handleIconClick = () => {
    if (web3User) {
      navigate(routerPaths.operator.profile);
      return;
    }

    if (web2Auth) {
      navigate(routerPaths.worker.profile);
      return;
    }
    setPageView('welcome');
    navigate(routerPaths.homePage);
  };

  return handleIconClick;
};
