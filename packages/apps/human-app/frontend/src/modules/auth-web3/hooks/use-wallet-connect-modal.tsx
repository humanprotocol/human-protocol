import { useModal } from '@/shared/contexts/modal-context';
import { WalletConnectModal } from '../components/wallet-connect-modal';

export function useWalletConnectModal() {
  const { openModal, closeModal } = useModal();

  return {
    openModal: () => {
      openModal({
        content: <WalletConnectModal close={closeModal} />,
        showCloseButton: false,
      });
    },
  };
}
