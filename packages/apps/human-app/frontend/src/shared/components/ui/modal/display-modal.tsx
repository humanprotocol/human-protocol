import { ModalContent } from './modal-content';
import { useModalStore } from './modal.store';
import { Modal } from './modal';
import { ModalHeader } from './modal-header';

export function DisplayModal() {
  const { isModalOpen, closeModal, modalState, displayCloseButton, maxWidth } =
    useModalStore();

  return (
    <>
      {modalState ? (
        <Modal isOpen={isModalOpen} maxWidth={maxWidth}>
          <ModalHeader
            closeButton={{
              isVisible: Boolean(displayCloseButton),
              onClick: closeModal,
            }}
          />
          <ModalContent modalType={modalState} />
        </Modal>
      ) : null}
    </>
  );
}
