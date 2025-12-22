import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

interface ModalContextType {
  open: boolean;
  content: React.ReactNode;
  showCloseButton: boolean;
  disableClose: boolean;
  openModal: ({ content, showCloseButton }: OpenModalProps) => void;
  closeModal: () => void;
  onTransitionExited: () => void;
  setDisableClose: (disable: boolean) => void;
}

interface OpenModalProps {
  content: React.ReactNode;
  showCloseButton?: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<React.ReactNode>(null);
  const [showCloseButton, setShowCloseButton] = useState(true);
  const [disableClose, setDisableClose] = useState(false);

  const openModal = useCallback(
    ({
      content: _modalContent,
      showCloseButton: _showCloseButton,
    }: OpenModalProps) => {
      setContent(_modalContent);
      setShowCloseButton(_showCloseButton ?? showCloseButton);
      setDisableClose(false);
      setOpen(true);
    },
    [showCloseButton]
  );

  const closeModal = useCallback(() => {
    if (disableClose) return;
    setOpen(false);
  }, [disableClose]);

  const onTransitionExited = useCallback(() => {
    setContent(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      open,
      content,
      showCloseButton,
      disableClose,
      openModal,
      closeModal,
      onTransitionExited,
      setDisableClose,
    }),
    [
      open,
      content,
      showCloseButton,
      disableClose,
      openModal,
      closeModal,
      onTransitionExited,
    ]
  );

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
