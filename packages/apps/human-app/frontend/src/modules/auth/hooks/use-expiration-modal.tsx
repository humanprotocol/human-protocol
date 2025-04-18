import { useModal } from '@/shared/contexts/modal-context';
import { ExpirationModal } from '@/modules/auth/components';

export function useExpirationModal() {
  const { openModal } = useModal();

  return {
    openModal: () => {
      openModal({
        content: <ExpirationModal />,
        showCloseButton: false,
      });
    },
  };
}
