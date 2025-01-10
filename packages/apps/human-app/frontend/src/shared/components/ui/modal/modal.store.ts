import { create } from 'zustand';
import type { ReactNode } from 'react';
import type { DialogProps as DialogMuiProps } from '@mui/material/Dialog';
import { type ModalType } from './modal-type.enum';

interface ModalState {
  isModalOpen: boolean;
  modalState: ModalType | undefined;
  maxWidth?: DialogMuiProps['maxWidth'];
  openModal: (args: {
    modalState: ModalType;
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
