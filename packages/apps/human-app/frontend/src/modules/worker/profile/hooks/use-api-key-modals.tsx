import { useModal } from '@/shared/contexts/modal-context';
import {
  AddApiKeyModal,
  EditApiKeyModal,
  DeleteApiKeyModal,
} from '../components';

export function useAddApiKeyModal() {
  const { openModal, closeModal } = useModal();

  return {
    openModal: () =>
      openModal({ content: <AddApiKeyModal onClose={closeModal} /> }),
  };
}

export function useEditApiKeyModal() {
  const { openModal, closeModal } = useModal();

  return {
    openModal: (exchangeName: string) =>
      openModal({
        content: (
          <EditApiKeyModal onClose={closeModal} exchangeName={exchangeName} />
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
