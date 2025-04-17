import { useModal } from '@/shared/contexts/modal-context';
import { ExpirationModal } from '@/modules/auth/components';

export function useExpirationModal() {
  const { openModal } = useModal();

  return {
    open: () => {
      openModal({
        content: <ExpirationModal />,
        showCloseButton: false,
      });
    },
  };
}
