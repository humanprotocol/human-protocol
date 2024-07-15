import { create } from 'zustand';
import type { ReactNode } from 'react';

interface ModalState {
  isModalOpen: boolean;
  modalState: ModalStateUnion | undefined;
  openModal: (
    modalState: ModalStateUnion,
    additionalContent?: ReactNode
  ) => void;
  closeModal: () => void;
  additionalContent: ReactNode;
}

export const MODAL_STATE = {
  MODAL_EXAMPLE: 'MODAL_EXAMPLE',
  WALLET_CONNECT: 'WALLET_CONNECT',
} as const;

export type ModalStateUnion = (typeof MODAL_STATE)[keyof typeof MODAL_STATE];

export type ModalStateKeys = keyof typeof MODAL_STATE;

export const useModalStore = create<ModalState>((set) => ({
  isModalOpen: false,
  modalState: undefined,
  additionalContent: undefined,
  openModal: (modalState, additionalContent) => {
    set(() => ({ isModalOpen: true, modalState, additionalContent }));
  },
  closeModal: () => {
    set(() => ({ isModalOpen: false, modalState: undefined }));
  },
}));
