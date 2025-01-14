import { create } from 'zustand';
import type { ReactNode } from 'react';
import type { DialogProps as DialogMuiProps } from '@mui/material/Dialog';

export enum ModalType {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  MODAL_EXAMPLE = 'MODAL_EXAMPLE',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  WALLET_CONNECT = 'WALLET_CONNECT',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  EXPIRATION_MODAL = 'EXPIRATION_MODAL',
}
interface ModalState {
  isModalOpen: boolean;
  modalType: ModalType | undefined;
  maxWidth?: DialogMuiProps['maxWidth'];
  openModal: (args: {
    modalType: ModalType;
    additionalContent?: ReactNode;
    maxWidth?: DialogMuiProps['maxWidth'];
    displayCloseButton?: boolean;
  }) => void;
  closeModal: () => void;
  additionalContent: ReactNode;
  displayCloseButton?: boolean;
}

export const useModalStore = create<ModalState>((set) => ({
  isModalOpen: false,
  modalType: undefined,
  additionalContent: undefined,
  displayCloseButton: undefined,
  maxWidth: undefined,
  openModal: ({
    modalType,
    additionalContent,
    maxWidth,
    displayCloseButton = true,
  }) => {
    set(() => ({
      isModalOpen: true,
      modalType,
      displayCloseButton,
      maxWidth,
      additionalContent,
    }));
  },
  closeModal: () => {
    set(() => ({
      isModalOpen: false,
      displayCloseButton: undefined,
      modalType: undefined,
    }));
  },
}));
