import type { ComponentType } from 'react';
import { ModalExample } from '@/modules/playground/components/modal-example/modal-example';
import { WalletConnectModal } from '@/modules/auth-web3/components/wallet-connect-modal';
import { ExpirationModal } from '@/modules/auth/components/expiration-modal';
import { ModalType } from './modal-type.enum';

const MODAL_COMPONENTS_MAP: Record<ModalType, ComponentType> = {
  [ModalType.ModalExample]: ModalExample,
  [ModalType.WalletConnect]: WalletConnectModal,
  [ModalType.ExpirationModal]: ExpirationModal,
};

interface ModalContent {
  modalType: ModalType;
}

export function ModalContent({ modalType }: ModalContent) {
  const Content = MODAL_COMPONENTS_MAP[modalType];
  return <Content />;
}
