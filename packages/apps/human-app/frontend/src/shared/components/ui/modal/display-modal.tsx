import { ModalContent } from './modal-content';
import { useModalStore } from './modal.store';
import { Modal } from './modal';
import { ModalHeader } from './modal-header';

export function DisplayModal() {
  const { isModalOpen, closeModal, modalType, displayCloseButton, maxWidth } =
    useModalStore();

  return (
    <>
      {modalType ? (
        <Modal isOpen={isModalOpen} maxWidth={maxWidth}>
          <ModalHeader
            closeButton={{
              isVisible: Boolean(displayCloseButton),
              onClick: closeModal,
            }}
          />
          <ModalContent modalType={modalType} />
        </Modal>
      ) : null}
    </>
  );
}
