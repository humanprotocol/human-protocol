import { useModal } from '@/shared/contexts/modal-context';
import {
  AddApiKeyModal,
  EditApiKeyModal,
  DeleteApiKeyModal,
} from '../components';

export function useAddApiKeyModal() {
  const { openModal, closeModal, setDisableClose } = useModal();

  return {
    openModal: () =>
      openModal({
        content: (
          <AddApiKeyModal onClose={closeModal} disableClose={setDisableClose} />
        ),
      }),
  };
}

export function useEditApiKeyModal() {
  const { openModal, closeModal, setDisableClose } = useModal();

  return {
    openModal: (exchangeName: string) =>
      openModal({
        content: (
          <EditApiKeyModal
            onClose={closeModal}
            exchangeName={exchangeName}
            disableClose={setDisableClose}
          />
        ),
      }),
  };
}

export function useDeleteApiKeyModal() {
  const { openModal, closeModal, setDisableClose } = useModal();

  return {
    openModal: () =>
      openModal({
        content: (
          <DeleteApiKeyModal
            onClose={closeModal}
            disableClose={setDisableClose}
          />
        ),
      }),
  };
}
