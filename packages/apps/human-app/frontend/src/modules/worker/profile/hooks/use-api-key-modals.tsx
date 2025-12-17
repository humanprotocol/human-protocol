import { useModal } from '@/shared/contexts/modal-context';
import {
  AddApiKeyModal,
  EditApiKeyModal,
  DeleteApiKeyModal,
} from '../components';

export function useAddApiKeyModal() {
  const { openModal } = useModal();

  return {
    openModal: () => openModal({ content: <AddApiKeyModal /> }),
  };
}

export function useEditApiKeyModal() {
  const { openModal, closeModal, open } = useModal();

  return {
    openModal: (exchangeName: string) =>
      openModal({
        content: (
          <EditApiKeyModal
            isOpen={open}
            onClose={closeModal}
            exchangeName={exchangeName}
          />
        ),
      }),
  };
}

export function useDeleteApiKeyModal() {
  const { openModal, closeModal } = useModal();

  return {
    openModal: () =>
      openModal({ content: <DeleteApiKeyModal onClose={closeModal} /> }),
  };
}
