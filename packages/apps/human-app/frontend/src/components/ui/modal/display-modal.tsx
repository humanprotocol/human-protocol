import { ModalContent } from './modal-content';
import { useModalStore } from './modal.store';
import { Modal } from './modal';
import { ModalHeader } from './modal-header';

export function DisplayModal() {
  const { isModalOpen, closeModal, modalState } = useModalStore();
  return (
    <>
      {modalState ? (
        <Modal isOpen={isModalOpen}>
          <ModalHeader closeButton={{ isVisible: true, onClick: closeModal }} />
          <ModalContent modalType={modalState} />
        </Modal>
      ) : null}
    </>
  );
}
