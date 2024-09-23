import type { ComponentType } from 'react';
import { ModalExample } from '@/pages/playground/modal-example/modal-example';
import { WalletConnectModal } from '@/auth-web3/wallet-connect-modal';
import { ExpirationModal } from '@/auth/expiration-modal';
import { UpdateVersionModal } from '@/pages/homepage/update-version-modal';
import type { ModalStateKeys, ModalStateUnion } from './modal.store';
import { MODAL_STATE } from './modal.store';

const MODAL_COMPONENTS: Record<ModalStateKeys, ComponentType> = {
  [MODAL_STATE.MODAL_EXAMPLE]: ModalExample,
  [MODAL_STATE.WALLET_CONNECT]: WalletConnectModal,
  [MODAL_STATE.EXPIRATION_MODAL]: ExpirationModal,
  [MODAL_STATE.UPDATE_VERSION_MODAL]: UpdateVersionModal,
};

interface ModalContent {
  modalType: ModalStateUnion;
}
export function ModalContent({ modalType }: ModalContent) {
  const Content = MODAL_COMPONENTS[modalType];
  return <Content />;
}
