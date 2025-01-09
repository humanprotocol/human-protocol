import type { ComponentType } from 'react';
import { ModalExample } from '@/modules/playground/components/modal-example/modal-example';
import { WalletConnectModal } from '@/modules/auth-web3/components/wallet-connect-modal';
import { ExpirationModal } from '@/modules/auth/components/expiration-modal';
import type { ModalStateKeys, ModalStateUnion } from './modal.store';
import { MODAL_STATE } from './modal.store';

const MODAL_COMPONENTS: Record<ModalStateKeys, ComponentType> = {
  [MODAL_STATE.MODAL_EXAMPLE]: ModalExample,
  [MODAL_STATE.WALLET_CONNECT]: WalletConnectModal,
  [MODAL_STATE.EXPIRATION_MODAL]: ExpirationModal,
};

interface ModalContent {
  modalType: ModalStateUnion;
}
export function ModalContent({ modalType }: ModalContent) {
  const Content = MODAL_COMPONENTS[modalType];
  return <Content />;
}
