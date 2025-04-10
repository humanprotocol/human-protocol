import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useConnectedWallet } from '@/shared/contexts/wallet-connect';
import { useWeb3Auth } from '@/modules/auth-web3/hooks/use-web3-auth';
import { routerPaths } from '@/router/router-paths';
import { signupService } from '@/modules/signup/services/signup.service';
import { ApiClientError } from '@/api';

export function useWeb3SignUp() {
  const { address, chainId } = useConnectedWallet();
  const { signIn } = useWeb3Auth();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async ({ signature }: { signature: string }) => {
      try {
        const response = await signupService.operatorWeb3SignUp({
          message: '',
          signature,
          address,
        });
        return response;
      } catch (error) {
        if (error instanceof ApiClientError) {
          throw new Error(String(error.data));
        }

        throw new Error('Failed to sign up operator with web3');
      }
    },
    onSuccess: (successResponse) => {
      signIn(successResponse);
      navigate(routerPaths.operator.profile);
    },
    mutationKey: ['web3SignUp', address, chainId],
  });
}
