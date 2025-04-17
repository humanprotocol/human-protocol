import type { ComponentType } from 'react';
import { WalletConnectModal } from '@/modules/auth-web3/components/wallet-connect-modal';
import { ModalType } from './modal.store';

const MODAL_COMPONENTS_MAP: Record<ModalType, ComponentType> = {
  [ModalType.WALLET_CONNECT]: WalletConnectModal,
};

interface ModalContent {
  modalType: ModalType;
}

export function ModalContent({ modalType }: Readonly<ModalContent>) {
  const Content = MODAL_COMPONENTS_MAP[modalType];
  return <Content />;
}
