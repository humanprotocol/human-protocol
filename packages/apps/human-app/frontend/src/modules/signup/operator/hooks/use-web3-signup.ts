import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';
import { useWeb3Auth } from '@/modules/auth-web3/hooks/use-web3-auth';
import { routerPaths } from '@/router/router-paths';
import { signupService } from '@/modules/signup/services/signup.service';

export function useWeb3SignUp() {
  const { address, chainId } = useConnectedWallet();
  const { signIn } = useWeb3Auth();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async ({ signature }: { signature: string }) =>
      signupService.operatorWeb3SignUp({
        message: '',
        signature,
        address,
      }),
    onSuccess: (successResponse) => {
      signIn(successResponse);
      navigate(routerPaths.operator.profile);
    },
    mutationKey: ['web3SignUp', address, chainId],
  });
}
