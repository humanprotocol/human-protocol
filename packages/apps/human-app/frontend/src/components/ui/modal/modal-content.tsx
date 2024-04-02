import type { ComponentType } from 'react';
import type { ModalStateKeys, ModalStateUnion } from './modal.store';
import { MODAL_STATE } from './modal.store';
import { ExampleModal } from './example-modal';

const MODAL_COMPONENTS: Record<ModalStateKeys, ComponentType> = {
  [MODAL_STATE.EXAMPLE_MODAL]: ExampleModal,
};

interface ModalContent {
  modalType: ModalStateUnion;
}
export function ModalContent({ modalType }: ModalContent) {
  const Content = MODAL_COMPONENTS[modalType];
  return <Content />;
}
