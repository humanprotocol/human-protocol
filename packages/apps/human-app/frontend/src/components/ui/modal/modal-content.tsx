import type { ComponentType } from 'react';
import { ModalExample } from '@/pages/playground/modal-example/modal-example';
import type { ModalStateKeys, ModalStateUnion } from './modal.store';
import { MODAL_STATE } from './modal.store';

const MODAL_COMPONENTS: Record<ModalStateKeys, ComponentType> = {
  [MODAL_STATE.MODAL_EXAMPLE]: ModalExample,
};

interface ModalContent {
  modalType: ModalStateUnion;
}
export function ModalContent({ modalType }: ModalContent) {
  const Content = MODAL_COMPONENTS[modalType];
  return <Content />;
}
