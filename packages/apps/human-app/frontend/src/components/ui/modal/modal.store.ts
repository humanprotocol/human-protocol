import { create } from 'zustand';
import type { ReactNode } from 'react';
import type { DialogProps as DialogMuiProps } from '@mui/material/Dialog';

interface ModalState {
  isModalOpen: boolean;
  modalState: ModalStateUnion | undefined;
  maxWidth?: DialogMuiProps['maxWidth'];
  openModal: (args: {
    modalState: ModalStateUnion;
    additionalContent?: ReactNode;
    maxWidth?: DialogMuiProps['maxWidth'];
    displayCloseButton?: boolean;
  }) => void;
  closeModal: () => void;
  additionalContent: ReactNode;
  displayCloseButton?: boolean;
}

export const MODAL_STATE = {
  MODAL_EXAMPLE: 'MODAL_EXAMPLE',
  WALLET_CONNECT: 'WALLET_CONNECT',
  EXPIRATION_MODAL: 'EXPIRATION_MODAL',
  UPDATE_VERSION_MODAL: 'UPDATE_VERSION_MODAL',
} as const;

export type ModalStateUnion = (typeof MODAL_STATE)[keyof typeof MODAL_STATE];

export type ModalStateKeys = keyof typeof MODAL_STATE;

export const useModalStore = create<ModalState>((set) => ({
  isModalOpen: false,
  modalState: undefined,
  additionalContent: undefined,
  displayCloseButton: undefined,
  maxWidth: undefined,
  openModal: ({
    modalState,
    additionalContent,
    maxWidth,
    displayCloseButton = true,
  }) => {
    set(() => ({
      isModalOpen: true,
      modalState,
      displayCloseButton,
      maxWidth,
      additionalContent,
    }));
  },
  closeModal: () => {
    set(() => ({
      isModalOpen: false,
      displayCloseButton: undefined,
      modalState: undefined,
    }));
  },
}));
